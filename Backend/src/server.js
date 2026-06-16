import http from "http";
import app from "./app.js";
import { testConnection } from "./config/database.js";
import { syncDatabase } from "./models/index.js";
import { initializeSocket } from "./config/socket.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = http.createServer(app);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log("⏳ Connecting to database...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error("❌ Failed to connect to database. Exiting...");
      logger.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    console.log("✅ Database connected successfully");

    // Initialize Socket.io
    initializeSocket(httpServer);
    console.log("✅ Socket.io initialized");

    // Start listening
    httpServer.listen(PORT, () => {
      console.log("\n🎉 ===============================================");
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(
        `📍 API: http://localhost:${PORT}/api/${process.env.API_VERSION || "v1"}`,
      );
      console.log(`🔌 Socket.io: Real-time enabled`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("🎉 ===============================================\n");

      logger.info(
        `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
      );
      logger.info(
        `📍 API Base URL: http://localhost:${PORT}/api/${process.env.API_VERSION || "v1"}`,
      );
      logger.info(`🔌 Socket.io enabled for real-time features`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

// Start the server
startServer();
