const express = require("express");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

const generateToken = require("../utils/generateToken");
const verifyAdmin = require("../middleware/verifyAdmin");
const router = express.Router();

// Register Admin (One time, then disable in production)
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const adminExists = await Admin.findOne({ email });
    if (adminExists) return res.status(400).json({ message: "Admin already exists" });

    const admin = await Admin.create({ email, password });
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login Admin
router.post("/login", async (req, res) => {
  try {
    console.log("Incoming login data:", req.body);

    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Admin found:", admin);

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Protected Route Example
router.get("/me", verifyAdmin, (req, res) => {
  res.json(req.admin);
});

module.exports = router;
