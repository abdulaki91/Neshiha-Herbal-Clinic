import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from Backend root directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

const sequelize = new Sequelize(
  process.env.DB_NAME || "neshiha_clinic",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  },
);

// Test database connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    return true;
  } catch (error) {
    console.error("❌ Unable to connect to the database:");
    console.error("Error:", error.message);
    console.error("\nDatabase Configuration:");
    console.error("- Host:", process.env.DB_HOST || "localhost");
    console.error("- Port:", process.env.DB_PORT || "5432");
    console.error("- Database:", process.env.DB_NAME || "neshiha_clinic");
    console.error("- User:", process.env.DB_USER || "postgres");
    console.error("- Password:", process.env.DB_PASSWORD ? "***" : "(empty)");
    return false;
  }
};

export default sequelize;
