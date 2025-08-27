// server/routes/videoRoutes.js
const express = require("express");
const router = express.Router();
const Video = require("../models/Video");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyAdmin = require("../middleware/verifyAdmin");

const videoUploadPath = path.join(process.cwd(), "uploads/videos");
if (!fs.existsSync(videoUploadPath)) {
  fs.mkdirSync(videoUploadPath, { recursive: true });
}

// ✅ Multer storage setup (100 MB limit)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, videoUploadPath),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 100 MB
});

// ✅ Helper for Base URL
const getBaseUrl = (req) =>
  process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

// ------------------- ROUTES ------------------- //

// ➕ Upload new video (or YouTube/Vimeo link)
router.post("/", verifyAdmin, upload.single("video"), async (req, res) => {
  try {
    let fileUrl = null;

    if (req.file) {
      // Direct upload
      fileUrl = `${getBaseUrl(req)}/uploads/videos/${req.file.filename}`;
    } else if (req.body.url) {
      // External link (YouTube/Vimeo)
      fileUrl = req.body.url.trim();
    } else {
      return res.status(400).json({ message: "No video or link provided" });
    }

    const video = new Video({
      title: req.body.title,
      category: req.body.category || "General",
      url: fileUrl,
    });

    await video.save();
    res.json(video);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Server error while uploading video" });
  }
});

// 📂 Get all videos
router.get("/", async (req, res) => {
  try {
    const BASE_URL = getBaseUrl(req);
    const videos = await Video.find().sort({ createdAt: -1 });

    const fixed = videos.map((v) => ({
      ...v._doc,
      url: v.url?.replace("http://localhost:5000", BASE_URL),
    }));

    res.json(fixed);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch videos" });
  }
});

// ❌ Delete video (DB + file if uploaded)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    // If it's a locally uploaded file, delete it
    if (video.url.startsWith(getBaseUrl(req))) {
      const filePath = path.join(videoUploadPath, path.basename(video.url));
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath).catch((err) =>
          console.error("File delete error:", err.message)
        );
      }
    }

    // Now delete DB record
    await Video.findByIdAndDelete(req.params.id);

    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Failed to delete video" });
  }
});


module.exports = router;
