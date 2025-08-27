import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp"; // ✅ for image compression
import Review from "../models/Review.js";
import verifyAdmin from "../middleware/verifyAdmin.js";

const router = express.Router();
const uploadDir = "uploads/reviews";

// Ensure folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage (temporary file)
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Helper to get Base URL dynamically
const getBaseUrl = (req) =>
  process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

// ------------------- ROUTES ------------------- //

// ➕ Add review with image (compressed)
router.post("/", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    let fileUrl = null;
    let relativePath = null;

    if (req.file) {
      const compressedFile = `compressed-${req.file.filename}`;
      const compressedPath = path.join(uploadDir, compressedFile);

      // Compress image (max 600px, 80% quality)
      await sharp(req.file.path)
        .resize({ width: 600 })
        .jpeg({ quality: 80 })
        .toFile(compressedPath);

      // Delete original uncompressed file
      fs.unlinkSync(req.file.path);

      relativePath = `reviews/${compressedFile}`;
      fileUrl = `${getBaseUrl(req)}/uploads/${relativePath}`;
    }

    const review = new Review({
      name: req.body.name,
      image: relativePath ? path.basename(relativePath) : null,
      path: relativePath,
      url: fileUrl,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    await review.save();
    res.json(review);
  } catch (err) {
    console.error("Add Review Error:", err);
    res.status(500).json({ message: "Failed to add review" });
  }
});

// 📂 Get all reviews (fix old records)
router.get("/", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
    const reviews = await Review.find().sort({ createdAt: -1 });

    const fixed = reviews.map((r) => ({
      ...r._doc,
      url: r.url?.replace("http://localhost:5000", BASE_URL),
    }));

    res.json(fixed);
  } catch (err) {
    console.error("Fetch Reviews Error:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// ✏️ Update review (with new compressed image)
router.put("/:id", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    let updateData = {
      name: req.body.name,
      rating: req.body.rating,
      comment: req.body.comment,
    };

    if (req.file) {
      const compressedFile = `compressed-${req.file.filename}`;
      const compressedPath = path.join(uploadDir, compressedFile);

      await sharp(req.file.path)
        .resize({ width: 600 })
        .jpeg({ quality: 80 })
        .toFile(compressedPath);

      fs.unlinkSync(req.file.path);

      const relativePath = `reviews/${compressedFile}`;
      const fileUrl = `${getBaseUrl(req)}/uploads/${relativePath}`;

      updateData.image = compressedFile;
      updateData.path = relativePath;
      updateData.url = fileUrl;
    }

    const review = await Review.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.json(review);
  } catch (err) {
    console.error("Update Review Error:", err);
    res.status(500).json({ message: "Failed to update review" });
  }
});

// ❌ Delete review (also remove file)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (review?.path) {
      const filePath = path.join(uploadDir, path.basename(review.path));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ message: "Review deleted" });
  } catch (err) {
    console.error("Delete Review Error:", err);
    res.status(500).json({ message: "Failed to delete review" });
  }
});

export default router;
