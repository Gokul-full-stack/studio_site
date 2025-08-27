const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String }, // filename
  path: { type: String },  // relative path (/uploads/reviews/...)
  url: { type: String },   // full URL for frontend
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", reviewSchema);
