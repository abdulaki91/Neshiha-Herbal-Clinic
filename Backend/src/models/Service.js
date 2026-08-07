import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Service = sequelize.define(
  "Service",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    icon: { type: DataTypes.STRING },
    title: { type: DataTypes.JSON, defaultValue: { en: "" } },
    description: { type: DataTypes.JSON, defaultValue: { en: "" } },
    // Array of feature strings, per locale: { en: [...], am: [...] }
    features: { type: DataTypes.JSON, defaultValue: { en: [] } },
    status: {
      type: DataTypes.STRING,
      defaultValue: "draft",
      validate: { isIn: [["draft", "published"]] },
    },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdBy: { type: DataTypes.UUID, references: { model: "users", key: "id" } },
    updatedBy: { type: DataTypes.UUID, references: { model: "users", key: "id" } },
  },
  { tableName: "services", timestamps: true },
);

export default Service;
