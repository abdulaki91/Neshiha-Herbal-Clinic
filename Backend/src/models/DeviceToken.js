import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * A phone running the staff mobile app, registered for Firebase push
 * notifications. One row per FCM token; a user can have several phones.
 * `language` is the app's interface language, so pushes arrive translated.
 */
const DeviceToken = sequelize.define(
  "DeviceToken",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    token: {
      type: DataTypes.STRING(512),
      allowNull: false,
      unique: true,
    },
    platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "android",
    },
    language: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: "en",
    },
  },
  {
    tableName: "device_tokens",
    timestamps: true,
  },
);

export default DeviceToken;
