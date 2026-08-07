import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from Backend root directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Postgres's driver auto-parses JSONB columns into JS objects/arrays, so
// Sequelize's JSON type never needed a read-side parser of its own. MySQL's
// driver (mysql2) does not do this — a JSON column always comes back as
// raw text, and MariaDB (what XAMPP ships, and common on shared hosting)
// makes it worse by reporting the column's wire type as BLOB rather than
// JSON, so even a typeCast keyed on the driver's reported field type won't
// catch it. Patching `_sanitize` here fixes it at the Sequelize layer
// instead: it's the same generic hydration hook the DATEONLY type already
// uses (see node_modules/sequelize/lib/dialects/mysql/data-types.js), and
// Sequelize calls it for every attribute typed DataTypes.JSON regardless of
// dialect — a no-op on Postgres, where the value already isn't a string.
DataTypes.JSON.prototype._sanitize = function (value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const sequelize = new Sequelize(
  process.env.DB_NAME || "neshiha_clinic",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || "mysql",
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
    console.error("- Port:", process.env.DB_PORT || "3306");
    console.error("- Database:", process.env.DB_NAME || "neshiha_clinic");
    console.error("- User:", process.env.DB_USER || "root");
    console.error("- Password:", process.env.DB_PASSWORD ? "***" : "(empty)");
    return false;
  }
};

export default sequelize;
