import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TeamMember = sequelize.define(
  "TeamMember",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    photo: { type: DataTypes.STRING },
    role: { type: DataTypes.JSONB, defaultValue: { en: "" } },
    bio: { type: DataTypes.JSONB, defaultValue: { en: "" } },
    socialLinks: { type: DataTypes.JSONB, defaultValue: {} },
    status: {
      type: DataTypes.STRING,
      defaultValue: "draft",
      validate: { isIn: [["draft", "published"]] },
    },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdBy: { type: DataTypes.UUID, references: { model: "users", key: "id" } },
    updatedBy: { type: DataTypes.UUID, references: { model: "users", key: "id" } },
  },
  { tableName: "team_members", timestamps: true },
);

export default TeamMember;
