const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const { socketAuth } = require("./middleware/auth");
const socketHandler = require("./utils/socketHandler");

// Try to load rate limiter (optional dependency)
let rateLimiters = { apiLimiter: null, authLimiter: null };
try {
  rateLimiters = require("./middleware/rateLimiter");
} catch (error) {
  console.warn("⚠️  Rate limiter not installed. Run 'npm install' to add security features.");
}

const app = express();
const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_URL || "http://localhost:8080";

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply rate limiting if available
if (rateLimiters.apiLimiter) {
  app.use("/api/", rateLimiters.apiLimiter);
}

// === MODIFICATION FOR NEW REACT FRONTEND BUILD ===
// Serve the production build of the React app from the root 'dist' folder
const buildPath = path.join(__dirname, "..", "dist");
app.use(express.static(buildPath));

// API Routes (with auth-specific rate limiting)
if (rateLimiters.authLimiter) {
  app.use("/api/auth/login", rateLimiters.authLimiter);
  app.use("/api/auth/register", rateLimiters.authLimiter);
}
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// Set io instance for chat routes to emit room creation events
chatRoutes.setIO(io);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// === ADDITION FOR CLIENT-SIDE ROUTING (React Router) ===
// For any GET request that is not an API route, serve the index.html file.
app.get("*", (req, res) => {
  // Check if the request path starts with an API prefix, to prevent accidentally serving index.html for missed API routes.
  if (req.path.startsWith("/api")) {
    return res.status(404).send("API endpoint not found.");
  }
  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) {
      // If index.html is not found, the frontend has likely not been built yet.
      if (err.code === "ENOENT") {
        console.warn(
          `Attempted to serve ${buildPath}/index.html, but it does not exist. Ensure 'npm run build:frontend' has been run.`
        );
        return res
          .status(404)
          .send("Frontend build not found. Run 'npm run build:frontend'.");
      }
      res.status(500).send(err.message);
    }
  });
});

// Socket.IO authentication
io.use(socketAuth);

// Socket.IO connection handler
socketHandler(io);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    // Start server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
