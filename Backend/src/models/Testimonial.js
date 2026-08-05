import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Testimonial = sequelize.define(
  "Testimonial",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientPhoto: {
      type: DataTypes.STRING,
    },
    // Translatable: { en, am, om, ar }
    role: {
      type: DataTypes.JSONB,
      defaultValue: { en: "" },
    },
    company: {
      type: DataTypes.STRING,
    },
    rating: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: { min: 1, max: 5 },
    },
    text: {
      type: DataTypes.JSONB,
      defaultValue: { en: "" },
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "draft",
      validate: { isIn: [["draft", "published"]] },
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    createdBy: {
      type: DataTypes.UUID,
      references: { model: "users", key: "id" },
    },
    updatedBy: {
      type: DataTypes.UUID,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "testimonials",
    timestamps: true,
  },
);

export default Testimonial;
