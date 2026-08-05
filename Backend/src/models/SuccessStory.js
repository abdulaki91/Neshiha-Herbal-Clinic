import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SuccessStory = sequelize.define(
  "SuccessStory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: { type: DataTypes.JSONB, defaultValue: { en: "" } },
    description: { type: DataTypes.JSONB, defaultValue: { en: "" } },
    images: { type: DataTypes.JSONB, defaultValue: [] },
    projectDetails: { type: DataTypes.JSONB, defaultValue: { en: "" } },
    outcomes: { type: DataTypes.JSONB, defaultValue: { en: "" } },
    category: { type: DataTypes.STRING },
    featured: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: {
      type: DataTypes.STRING,
      defaultValue: "draft",
      validate: { isIn: [["draft", "published"]] },
    },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdBy: { type: DataTypes.UUID, references: { model: "users", key: "id" } },
    updatedBy: { type: DataTypes.UUID, references: { model: "users", key: "id" } },
  },
  { tableName: "success_stories", timestamps: true },
);

export default SuccessStory;
