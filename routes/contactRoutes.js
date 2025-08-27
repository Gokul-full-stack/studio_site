const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const Inquiry = require("../models/Inquiry");
const verifyAdmin = require("../middleware/verifyAdmin");

// User sends inquiry
router.post("/", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    // Store in DB
    const inquiry = new Inquiry({ name, email, message, status: "pending" });
    await inquiry.save();

    // 📧 Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });

    // Email to Studio
    await transporter.sendMail({
      from: `"JOVI Studios" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "📩 New Inquiry from Contact Form",
      html: `
        <h3>New Inquiry Received</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    // Confirmation Email to Customer
    await transporter.sendMail({
      from: `"JOVI Studios" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Thank you for contacting JOVI Studios!",
      html: `
        <h3>Hi ${name},</h3>
        <p>Thank you for reaching out! We have received your inquiry and will get back to you soon.</p>
        <p>Best Regards,<br/>JOVI Studios</p>
      `,
    });

    res.status(200).json({ success: true, message: "Inquiry sent successfully" });
  } catch (error) {
    console.error("❌ Error sending inquiry:", error.message);
    res.status(500).json({ success: false, message: "Failed to send inquiry" });
  }
});

// Admin: Get inquiries
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inquiries" });
  }
});

// Admin: Update inquiry status
router.put("/:id/status", verifyAdmin, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ message: "Failed to update inquiry" });
  }
});

module.exports = router;
