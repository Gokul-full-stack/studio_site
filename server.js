import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import serviceRoutes from "./routes/serviceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminStatsRoutes from "./routes/adminStats.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Optimized CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://thriving-platypus-622369.netlify.app" // add your other deploy too
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ Security Middleware
app.use(express.json({ limit: "10mb" })); // prevents large payload attacks

// ✅ Static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ MongoDB Connection with better logging
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));

// ✅ Routes
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/stats", adminStatsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/videos", videoRoutes);

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🚀 Server is running fine...");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
