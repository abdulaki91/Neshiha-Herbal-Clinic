import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      references: {
        model: "users",
        key: "id",
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "e.g., CREATE, UPDATE, DELETE, LOGIN, LOGOUT",
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "e.g., Patient, Visit, Medicine, User",
    },
    resourceId: {
      type: DataTypes.STRING,
      comment: "ID of the affected resource",
    },
    description: {
      type: DataTypes.TEXT,
    },
    oldValues: {
      type: DataTypes.JSON,
      comment: "Previous values before update",
    },
    newValues: {
      type: DataTypes.JSON,
      comment: "New values after update",
    },
    ipAddress: {
      type: DataTypes.STRING,
    },
    userAgent: {
      type: DataTypes.TEXT,
    },
    metadata: {
      type: DataTypes.JSON,
      comment: "Additional metadata",
    },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    updatedAt: false, // Audit logs should never be updated
  },
);

export default AuditLog;
