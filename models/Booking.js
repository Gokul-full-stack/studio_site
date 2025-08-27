// models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  date: { type: String, required: true },
  typeOfShoot: { type: String, required: true },
  time: { type: String },
  phone: { type: String, required: true },
  location: { type: String, required: true },
  message: { type: String },
  status: { type: String, default: "pending" },
  adminNotes: { type: String },
  payment: { type: Number, default: 0 }   // 💰 Added
});

module.exports = mongoose.model("Booking", bookingSchema);
