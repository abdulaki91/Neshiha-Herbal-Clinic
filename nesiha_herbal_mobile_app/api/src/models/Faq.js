import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Faq = sequelize.define(
  "Faq",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    question: { type: DataTypes.JSON, defaultValue: { en: "" } },
    answer: { type: DataTypes.JSON, defaultValue: { en: "" } },
    category: { type: DataTypes.STRING },
    status: {
      type: DataTypes.STRING,
      defaultValue: "draft",
      validate: { isIn: [["draft", "published"]] },
    },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdBy: { type: DataTypes.UUID, references: { model: "users", key: "id" } },
    updatedBy: { type: DataTypes.UUID, references: { model: "users", key: "id" } },
  },
  { tableName: "faqs", timestamps: true },
);

export default Faq;
