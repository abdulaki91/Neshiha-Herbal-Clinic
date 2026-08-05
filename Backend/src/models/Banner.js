import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Banner = sequelize.define(
  "Banner",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: { type: DataTypes.JSONB, defaultValue: { en: "" } },
    subtitle: { type: DataTypes.JSONB, defaultValue: { en: "" } },
    image: { type: DataTypes.STRING },
    ctaText: { type: DataTypes.JSONB, defaultValue: { en: "" } },
    ctaLink: { type: DataTypes.STRING },
    startDate: { type: DataTypes.DATE },
    endDate: { type: DataTypes.DATE },
    status: {
      type: DataTypes.STRING,
      defaultValue: "draft",
      validate: { isIn: [["draft", "published"]] },
    },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdBy: { type: DataTypes.UUID, references: { model: "users", key: "id" } },
    updatedBy: { type: DataTypes.UUID, references: { model: "users", key: "id" } },
  },
  { tableName: "banners", timestamps: true },
);

export default Banner;
