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
      await sequelize.drop();
      logger.info("✅ All tables dropped successfully");
    } else {
      logger.info("Running database migrations...");
      await syncDatabase(false); // Set to true to force recreate
      logger.info("✅ Database migrations completed successfully");
    }

    process.exit(0);
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
