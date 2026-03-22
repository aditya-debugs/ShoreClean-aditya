// server/src/index.js
// ShoreClean Backend Server - Main Entry Point
require("dotenv").config({ path: __dirname + "/../.env" });
const express = require("express");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { initializeSocketHandlers } = require("./utils/socketHandler");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const donationRoutes = require("./routes/donationRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const groupRoutes = require("./routes/groupRoutes");
const communityRoutes = require("./routes/communityRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const commentRoutes = require("./routes/commentRoutes.js");
const markerRoutes = require("./routes/markerRoutes");

const ratingRoutes = require("./routes/ratingRoutes.js");
const organizationRoutes = require("./routes/organizationRoutes");

const app = express();
const server = http.createServer(app);

// This must be before the express.json() middleware for Stripe webhooks
app.use("/api/webhooks", webhookRoutes);

// Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Initialize database connection
connectDB();

app.use(express.json());
app.use(cookieParser());

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: "Too many requests, please try again later" } });
const donationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: "Too many donation requests, please try again later" } });

// CORS: allow client to send cookies to server
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      process.env.CLIENT_URL || "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Increase JSON body limit to 10mb to support base64-encoded images
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// Mount routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/donations", donationLimiter, donationRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api", ratingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/markers", markerRoutes);

app.use("/api/organizations", organizationRoutes);
app.use("/api/communities", communityRoutes);

// Initialize Socket.io handlers for real-time chat
initializeSocketHandlers(io);

// example protected route
const { protect } = require("./middlewares/authMiddleware");
app.get("/api/profile", protect, async (req, res) => {
  // req.user set in protect
  res.json({ message: "Protected profile", user: req.user });
});

// ─── One-time migration: clean up incorrectly named / extra default groups so
//     the lazy-init recreates them with the org's name included.
(async () => {
  try {
    const Group = require("./models/Group");

    // Remove old extra types (Community Chat, Certificates & Info)
    const extra = await Group.deleteMany({
      type: { $in: ["general", "certificates"] },
      eventId: null,
    });

    // Remove generic "Announcements" groups that were created without an org name
    const generic = await Group.deleteMany({
      type: "announcements",
      name: "Announcements", // only the plain name — org-named ones (e.g. "Bhumik — Announcements") are kept
      eventId: null,
    });

    const total = (extra.deletedCount || 0) + (generic.deletedCount || 0);
    if (total > 0) {
      console.log(`🧹 Migration: removed ${total} stale default group(s) — will be recreated with org name on next /chat visit`);
    }
  } catch (e) {
    console.warn("Migration warning:", e.message);
  }
})();

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "ShoreClean API is running",
    timestamp: new Date().toISOString(),
    features: {
      chat: true,
      websocket: true,
      database: true,
    },
  });
});

// Global error handler — must be last middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 ShoreClean server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time chat`);
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
  console.log(`💬 Chat endpoints: http://localhost:${PORT}/api/chat`);
});
