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
    title: { type: DataTypes.JSON, defaultValue: { en: "" } },
    description: { type: DataTypes.JSON, defaultValue: { en: "" } },
    images: { type: DataTypes.JSON, defaultValue: [] },
    projectDetails: { type: DataTypes.JSON, defaultValue: { en: "" } },
    outcomes: { type: DataTypes.JSON, defaultValue: { en: "" } },
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
