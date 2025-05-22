require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// Import routes
const foodRoutes = require("./routes/food");
const diaryRoutes = require("./routes/diaryRoutes");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Logging
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" })); // For JSON request bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Form data

// Serve static files if needed
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/food", foodRoutes);
app.use("/api/diary", diaryRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "ScanFood API is running",
    version: "1.0.0",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || "Internal Server Error",
      status: statusCode,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: "Route not found",
      status: 404,
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`ScanFood API server running on port ${PORT}`);
});

module.exports = app;
