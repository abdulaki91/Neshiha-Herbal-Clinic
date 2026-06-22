import { sequelize } from "../models/index.js";

async function run() {
  try {
    console.log("Syncing database tables (alter: true)...");
    await sequelize.sync({ alter: true });
    console.log("✅ Database synced successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  }
}

run();
