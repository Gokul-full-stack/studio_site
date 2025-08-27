const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const Gallery = require("../models/Gallery");
const verifyAdmin = require("../middleware/verifyAdmin");

const router = express.Router();
const uploadDir = "uploads/gallery";

// Ensure folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config (upload to "uploads/gallery")
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Helper for Base URL
const getBaseUrl = (req) =>
  process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

// ------------------- ROUTES ------------------- //

// ➕ Upload new image (with compression)
router.post("/", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const compressedFile = `compressed-${Date.now()}.jpg`;
    const compressedPath = path.join(uploadDir, compressedFile);

    // Compress image
    await sharp(req.file.path)
      .resize(1200)
      .jpeg({ quality: 70 })
      .toFile(compressedPath);

    // ✅ Delete original safely (use fs.promises.unlink)
    await fs.promises.unlink(req.file.path).catch((err) => {
      console.warn("Could not delete original file:", err.message);
    });

    const relativePath = `gallery/${compressedFile}`;
    const fileUrl = `${getBaseUrl(req)}/uploads/${relativePath}`;

    const newImage = new Gallery({
      filename: compressedFile,
      path: relativePath,
      url: fileUrl,
      caption: req.body.caption,
      category: req.body.category ? req.body.category.trim() : "others",
    });

    await newImage.save();
    res.json(newImage);
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Image compression failed" });
  }
});

// 📂 Fetch all images
router.get("/", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
    const images = await Gallery.find().sort({ createdAt: -1 });

    const formatted = images.map((img) => ({
      ...img._doc,
      url: img.url?.replace("http://localhost:5000", BASE_URL),
    }));

    res.json(formatted || []);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Failed to fetch gallery" });
  }
});

// ❌ Delete image (DB + file)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) return res.status(404).json({ message: "Image not found" });

    // Delete physical file first
    if (image?.path) {
      const filePath = path.join(uploadDir, path.basename(image.path));
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath).catch((err) =>
          console.error("File delete error:", err.message)
        );
      }
    }

    // Now delete DB record
    await Gallery.findByIdAndDelete(req.params.id);

    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Failed to delete image" });
  }
});

module.exports = router;
