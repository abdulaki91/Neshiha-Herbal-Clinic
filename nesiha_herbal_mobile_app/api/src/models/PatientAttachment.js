import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PatientAttachment = sequelize.define(
  "PatientAttachment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "patients",
        key: "id",
      },
    },
    visitId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "visits",
        key: "id",
      },
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileType: {
      type: DataTypes.STRING,
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "patient_attachments",
    timestamps: true,
  },
);

export default PatientAttachment;
