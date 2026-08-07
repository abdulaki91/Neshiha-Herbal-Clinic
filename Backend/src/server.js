// Must be the first import — see loadEnv.js for why.
import "./config/loadEnv.js";
import http from "http";
import app from "./app.js";
import sequelize, { testConnection } from "./config/database.js";
import { initializeSocket } from "./config/socket.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = http.createServer(app);

// Self-healing schema patches — additive ALTER/CREATE TABLE statements that
// bring an existing database up to date with the current models, since
// sequelize.sync() is never called on boot (see models/index.js). Not
// blocking startup on this matters under Phusion Passenger (cPanel's
// "Setup Node.js App"), which recycles the Node process between requests —
// every cold start would otherwise run this chain before the server could
// accept a single request (see startServer below, which fires this in the
// background after listen()).
//
// This function is intentionally empty right now. It used to carry ~25
// Postgres-specific statements (JSONB/TIMESTAMPTZ columns, `ALTER TYPE
// ... ADD VALUE` for enums, `ADD COLUMN IF NOT EXISTS`, etc.) written to
// catch up a live Postgres database whose tables predated later model
// changes. Every one of those columns and tables is now part of the base
// model definitions in src/models/ (see Medicine.code, Prescription.unitPrice/
// totalAmount, Visit.scheduledTime/followUpFromVisitId, Setting's Business/
// Contact Information fields, and the Testimonial/SuccessStory/Faq/
// TeamMember/Partner/Banner/Service/BookingRequest/RegistrationPayment
// models), so a database created fresh via `npm run migrate` (sequelize
// sync) already has the full current schema and needs no patching.
// Add new statements here — using MySQL syntax (e.g. `ALTER TABLE ...
// MODIFY COLUMN ... ENUM(...)` to extend an enum, not Postgres's `ALTER
// TYPE`) — the next time a column needs to be added to a database that
// already has data and can't just be force-synced.
const applySchemaPatches = async () => {};

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

    // Start listening immediately — don't make every request wait behind
    // the schema-patch block (see applySchemaPatches' comment above for
    // why this ordering is safe).
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

    // Run schema patches in the background so they don't delay accepting
    // connections; log (but don't crash) if one fails.
    applySchemaPatches().catch((err) => {
      console.error("⚠️  Schema patch run failed:", err.message);
      logger.error("Schema patch run failed:", err);
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
