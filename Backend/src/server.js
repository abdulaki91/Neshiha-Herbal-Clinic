import http from "http";
import app from "./app.js";
import sequelize, { testConnection } from "./config/database.js";
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

    // Ensure required columns exist and fix schema mismatches
    try {
      await sequelize.query(
        `ALTER TABLE medicines ADD COLUMN IF NOT EXISTS code VARCHAR(255)`
      );
      await sequelize.query(
        `ALTER TABLE medicines ALTER COLUMN code DROP NOT NULL`
      );
      await sequelize.query(
        `ALTER TABLE medicines DROP CONSTRAINT IF EXISTS medicines_code_key`
      );
      await sequelize.query(
        `ALTER TABLE medicines ADD CONSTRAINT medicines_code_key UNIQUE (code)`
      );
    } catch {
      // Ignore if already applied
    }
    try {
      await sequelize.query(
        `ALTER TABLE medicines ALTER COLUMN medicine_id DROP NOT NULL`
      );
    } catch {
      // medicine_id column may not exist, ignore
    }
    try {
      await sequelize.query(
        `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0`
      );
      await sequelize.query(
        `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0`
      );
    } catch {
      // Columns may already exist, ignore
    }

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
