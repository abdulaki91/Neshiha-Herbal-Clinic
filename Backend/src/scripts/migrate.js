import { sequelize, syncDatabase } from "../models/index.js";
import logger from "../config/logger.js";
import { testConnection } from "../config/database.js";

// MySQL has no Postgres-style "schema" to drop/recreate — a MySQL "schema"
// *is* the database, and dropping the database Sequelize is currently
// connected to would break the very connection we need to recreate it with.
// Instead, disable FK checks and drop every table in the database one by
// one; force-syncing right after rebuilds them all from the current models.
const dropAllTables = async () => {
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  try {
    const [tables] = await sequelize.query("SHOW TABLES");
    const tableNames = tables.map((row) => Object.values(row)[0]);
    for (const table of tableNames) {
      await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
  } finally {
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  }
};

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
      await dropAllTables();
      logger.info("✅ All tables dropped successfully");
    } else {
      logger.info("Running database migrations...");

      // Drop all tables first
      console.log("🗑️  Dropping existing tables...");
      try {
        await dropAllTables();
        console.log("✅ Existing tables dropped successfully.");
      } catch (err) {
        console.log("⚠️  Database already clean or doesn't exist.");
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
