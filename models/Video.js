const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true }, // video file path or YouTube/Vimeo URL
  category: { type: String, default: "General" }, // ✅ New field
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Video", videoSchema);
