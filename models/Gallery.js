const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true }, // relative path like "gallery/xxx.jpg"
  url: { type: String },                  // ✅ add this for full URL
  caption: { type: String },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Gallery", gallerySchema);
