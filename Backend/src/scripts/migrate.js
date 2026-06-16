import { sequelize, syncDatabase } from "../models/index.js";
import logger from "../config/logger.js";
import { testConnection } from "../config/database.js";

const runMigration = async () => {
  try {
    const args = process.argv.slice(2);
    const command = args[0];

    // Test database connection
    const connected = await testConnection();

    if (!connected) {
      logger.error("Failed to connect to database");
      process.exit(1);
    }

    if (command === "undo") {
      logger.info("Dropping all tables...");
      // Drop schema and recreate
      await sequelize.query("DROP SCHEMA public CASCADE;");
      await sequelize.query("CREATE SCHEMA public;");
      await sequelize.query("GRANT ALL ON SCHEMA public TO postgres;");
      await sequelize.query("GRANT ALL ON SCHEMA public TO public;");
      logger.info("✅ All tables dropped successfully");
    } else {
      logger.info("Running database migrations...");

      // Drop all tables first using raw SQL
      console.log("🗑️  Dropping existing tables...");
      try {
        await sequelize.query("DROP SCHEMA public CASCADE;");
        await sequelize.query("CREATE SCHEMA public;");
        await sequelize.query("GRANT ALL ON SCHEMA public TO postgres;");
        await sequelize.query("GRANT ALL ON SCHEMA public TO public;");
        console.log("✅ Schema reset successfully.");
      } catch (err) {
        console.log("⚠️  Schema already clean or doesn't exist.");
      }

      // Force recreate all tables
      await syncDatabase(true); // force: true to recreate tables
      logger.info("✅ Database migrations completed successfully");
    }

    process.exit(0);
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
