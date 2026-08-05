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
    try {
      // Appointment scheduling: new column + enum value for pre-booked visits
      await sequelize.query(
        `ALTER TABLE visits ADD COLUMN IF NOT EXISTS scheduled_time TIME`
      );
      await sequelize.query(
        `ALTER TYPE enum_visits_status ADD VALUE IF NOT EXISTS 'scheduled'`
      );
    } catch {
      // Column/enum value may already exist, ignore
    }
    try {
      // Patient registration now collects age directly instead of date of
      // birth — drop the old NOT NULL so new inserts (which no longer send
      // date_of_birth) succeed, and backfill/enforce age instead
      await sequelize.query(
        `ALTER TABLE patients ALTER COLUMN date_of_birth DROP NOT NULL`
      );
      await sequelize.query(
        `UPDATE patients SET age = EXTRACT(YEAR FROM AGE(date_of_birth))::int WHERE age IS NULL AND date_of_birth IS NOT NULL`
      );
      await sequelize.query(
        `UPDATE patients SET age = 0 WHERE age IS NULL`
      );
      await sequelize.query(
        `ALTER TABLE patients ALTER COLUMN age SET NOT NULL`
      );
    } catch {
      // Constraint already relaxed, ignore
    }
    try {
      // Links an auto-scheduled follow-up appointment back to the
      // consultation that generated it
      await sequelize.query(
        `ALTER TABLE visits ADD COLUMN IF NOT EXISTS follow_up_from_visit_id UUID REFERENCES visits(id)`
      );
    } catch {
      // Column may already exist, ignore
    }
    try {
      // Business Information + Contact Information fields on the settings
      // singleton, for the public website CMS
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS tagline JSONB`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS mission JSONB`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS vision JSONB`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS about_text JSONB`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS years_experience INTEGER`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS patients_served INTEGER`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS treatments_offered INTEGER`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(255)`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255)`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255)`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255)`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255)`
      );
      await sequelize.query(
        `ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_maps_embed_url VARCHAR(255)`
      );
    } catch {
      // Columns may already exist, ignore
    }
    try {
      // Website CMS content tables — created here (not via sequelize.sync,
      // which is never called on boot) so they self-heal into existence on
      // any environment without a destructive migrate.js run.
      const localeDefault = `'{"en":""}'::jsonb`;
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS testimonials (
          id UUID PRIMARY KEY,
          client_name VARCHAR(255) NOT NULL,
          client_photo VARCHAR(255),
          role JSONB DEFAULT ${localeDefault},
          company VARCHAR(255),
          rating INTEGER DEFAULT 5,
          text JSONB DEFAULT ${localeDefault},
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS success_stories (
          id UUID PRIMARY KEY,
          title JSONB DEFAULT ${localeDefault},
          description JSONB DEFAULT ${localeDefault},
          images JSONB DEFAULT '[]'::jsonb,
          project_details JSONB DEFAULT ${localeDefault},
          outcomes JSONB DEFAULT ${localeDefault},
          category VARCHAR(255),
          featured BOOLEAN NOT NULL DEFAULT FALSE,
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS faqs (
          id UUID PRIMARY KEY,
          question JSONB DEFAULT ${localeDefault},
          answer JSONB DEFAULT ${localeDefault},
          category VARCHAR(255),
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS team_members (
          id UUID PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          photo VARCHAR(255),
          role JSONB DEFAULT ${localeDefault},
          bio JSONB DEFAULT ${localeDefault},
          social_links JSONB DEFAULT '{}'::jsonb,
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS partners (
          id UUID PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          logo VARCHAR(255),
          website_url VARCHAR(255),
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS banners (
          id UUID PRIMARY KEY,
          title JSONB DEFAULT ${localeDefault},
          subtitle JSONB DEFAULT ${localeDefault},
          image VARCHAR(255),
          cta_text JSONB DEFAULT ${localeDefault},
          cta_link VARCHAR(255),
          start_date TIMESTAMPTZ,
          end_date TIMESTAMPTZ,
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS services (
          id UUID PRIMARY KEY,
          icon VARCHAR(50),
          title JSONB DEFAULT ${localeDefault},
          description JSONB DEFAULT ${localeDefault},
          features JSONB DEFAULT '{"en":[]}'::jsonb,
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    } catch (err) {
      // Tables may already exist; log unexpected failures instead of
      // silently swallowing a genuine schema problem
      console.error("⚠️  CMS table creation issue:", err.message);
    }
    try {
      // Public-website "Book Appointment" submissions — reviewed by staff,
      // not auto-scheduled (see BookingRequest.js for why this isn't just
      // a Visit).
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS booking_requests (
          id UUID PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          phone VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          preferred_date DATE NOT NULL,
          preferred_time VARCHAR(255),
          reason TEXT,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          staff_notes TEXT,
          reviewed_by UUID REFERENCES users(id),
          converted_visit_id UUID REFERENCES visits(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    } catch (err) {
      console.error("⚠️  booking_requests table creation issue:", err.message);
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
