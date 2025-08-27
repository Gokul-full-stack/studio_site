// server/routes/adminStats.js
const express = require("express");
const Booking = require("../models/Booking");
const Inquiry = require("../models/Inquiry");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const totalInquiries = await Inquiry.countDocuments();
    const pendingInquiries = await Inquiry.countDocuments({ status: "pending" });

    res.json({ totalBookings, pendingBookings, totalInquiries, pendingInquiries });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
});

module.exports = router;
