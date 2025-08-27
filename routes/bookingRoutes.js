const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const sendEmail = require("../utils/sendEmail");
const verifyAdmin = require("../middleware/verifyAdmin"); // ✅ only for admin APIs

// Create booking
router.post("/", async (req, res) => {
  try {
    const { name, email, date, typeOfShoot, message, time, location, phone } = req.body;

    // ❌ Prevent double booking
    const existing = await Booking.findOne({ date, time });
    if (existing) {
      return res.status(400).json({ message: "Slot already booked. Please choose another time." });
    }

    const booking = new Booking({
      name,
      email,
      date,
      typeOfShoot,
      time,
      location,
      message,
      phone,
      status: "pending" // ✅ new field
    });
    await booking.save();

    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: "🎉 Booking Confirmed!",
      text: `Hello ${name},\n\nYour ${typeOfShoot} shoot is confirmed for ${date} in ${location}.\n\nThanks for booking with us!\n\n Jovi Studio Team`,
    });

    // Send alert to studio admin
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: "📸 New Booking Alert!",
      text: `New booking:\n\nName: ${name}\nEmail: ${email}\nDate: ${date}\nType: ${typeOfShoot}\nLocation: ${location}\nPhone: ${phone}`,
    });

    res.status(201).json({ message: "Booking successful and email sent!" });
  } catch (error) {
    console.error("Booking Error:", error.message);
    res.status(500).json({ message: "Booking failed." });
  }
});

// Get all bookings (Admin only) with pagination
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find()
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments();

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching bookings:", error.message);
    res.status(500).json({ message: "Failed to load bookings." });
  }
});

// Update booking status (Admin only)
router.put("/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Failed to update booking." });
  }
});

// Get booked slots (for calendar availability)
router.get("/availability", async (req, res) => {
  try {
    const bookings = await Booking.find({}, "date time");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Failed to load booking data." });
  }
});

// Update booking payment (Admin only)
router.put("/:id/payment", verifyAdmin, async (req, res) => {
  try {
    const { payment } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { payment },
      { new: true }
    );
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Failed to update payment." });
  }
});


module.exports = router;
