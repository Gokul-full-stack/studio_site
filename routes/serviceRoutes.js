import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";  // ✅ for image optimization
import Service from "../models/Service.js";
import verifyAdmin from "../middleware/verifyAdmin.js";

const router = express.Router();

// Ensure upload folder exists
const uploadDir = "uploads/services";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config (temporary filename, Sharp will optimize)
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Helper: Get Base URL dynamically
const getBaseUrl = (req) => {
  return process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
};

// ------------------- ROUTES ------------------- //

// ➕ Add new service with image (compressed)
router.post("/", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    let imageUrl = "";

    if (req.file) {
  const compressedFile = `compressed-${Date.now()}.jpeg`;
  const compressedPath = path.join(uploadDir, compressedFile);

  await sharp(req.file.path)
    .resize({ width: 800 })
    .jpeg({ quality: 80 })
    .toFile(compressedPath);

  await fs.promises.unlink(req.file.path).catch(() => {});

  imageUrl = `${getBaseUrl(req)}/uploads/services/${compressedFile}`;
}

    const service = new Service({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      image: imageUrl,
    });

    await service.save();
    res.json(service);
  } catch (err) {
    console.error("Add Service Error:", err);
    res.status(500).json({ message: "Failed to add service" });
  }
});

// 📂 Get all services
router.get("/", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
    const services = await Service.find().sort({ createdAt: -1 });

    // Ensure image URLs are always correct
    const fixed = services.map((s) => ({
      ...s._doc,
      image: s.image?.replace("http://localhost:5000", BASE_URL),
    }));

    res.json(fixed);
  } catch (err) {
    console.error("Fetch Services Error:", err);
    res.status(500).json({ message: "Failed to fetch services" });
  }
});

// ✏️ Edit service (with optional new compressed image)
router.put("/:id", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
    };

    if (req.file) {
      const compressedFile = `compressed-${req.file.filename}`;
      const compressedPath = path.join(uploadDir, compressedFile);

      await sharp(req.file.path)
        .resize({ width: 800 })
        .jpeg({ quality: 80 })
        .toFile(compressedPath);

      fs.unlinkSync(req.file.path);

      updateData.image = `${getBaseUrl(req)}/uploads/services/${compressedFile}`;
    }

    const service = await Service.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.json(service);
  } catch (err) {
    console.error("Update Service Error:", err);
    res.status(500).json({ message: "Failed to update service" });
  }
});

// ❌ Delete service
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    // Remove file from disk if it exists
    if (service?.image) {
  const filePath = path.join(uploadDir, path.basename(service.image));
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath).catch(() => {});
  }
}

    res.json({ message: "Service deleted" });
  } catch (err) {
    console.error("Delete Service Error:", err);
    res.status(500).json({ message: "Failed to delete service" });
  }
});

export default router;
