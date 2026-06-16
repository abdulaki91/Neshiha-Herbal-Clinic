import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { INVESTIGATION_STATUS } from "../config/constants.js";

const Investigation = sequelize.define(
  "Investigation",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    visitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "visits",
        key: "id",
      },
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "patients",
        key: "id",
      },
    },
    requestedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    investigationType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "e.g., Blood Test, X-Ray, CT Scan, Ultrasound",
    },
    testName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    instructions: {
      type: DataTypes.TEXT,
    },
    urgency: {
      type: DataTypes.ENUM("routine", "urgent", "stat"),
      defaultValue: "routine",
    },
    status: {
      type: DataTypes.ENUM(...Object.values(INVESTIGATION_STATUS)),
      defaultValue: INVESTIGATION_STATUS.REQUESTED,
    },
    requestedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    scheduledDate: {
      type: DataTypes.DATE,
    },
    completedDate: {
      type: DataTypes.DATE,
    },
    results: {
      type: DataTypes.TEXT,
      comment: "Investigation results",
    },
    resultFile: {
      type: DataTypes.STRING,
      comment: "Path to uploaded result file",
    },
    interpretation: {
      type: DataTypes.TEXT,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    performedBy: {
      type: DataTypes.STRING,
      comment: "Lab technician or radiologist name",
    },
    reviewedBy: {
      type: DataTypes.UUID,
      references: {
        model: "users",
        key: "id",
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      references: {
        model: "users",
        key: "id",
      },
    },
    updatedBy: {
      type: DataTypes.UUID,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "investigations",
    timestamps: true,
  },
);

export default Investigation;
