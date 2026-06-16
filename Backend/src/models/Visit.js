import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { VISIT_STATUS } from "../config/constants.js";
import { generateVisitNumber } from "../utils/helpers.js";

const Visit = sequelize.define(
  "Visit",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    visitNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "patients",
        key: "id",
      },
    },
    doctorId: {
      type: DataTypes.UUID,
      references: {
        model: "users",
        key: "id",
      },
    },
    visitDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    arrivalTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    consultationStartTime: {
      type: DataTypes.TIME,
    },
    consultationEndTime: {
      type: DataTypes.TIME,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(VISIT_STATUS)),
      defaultValue: VISIT_STATUS.WAITING,
    },
    chiefComplaint: {
      type: DataTypes.TEXT,
    },
    symptoms: {
      type: DataTypes.TEXT,
      comment: "JSON array of symptoms",
    },
    historyOfPresentIllness: {
      type: DataTypes.TEXT,
    },
    pastHistory: {
      type: DataTypes.TEXT,
    },
    // Vital Signs
    temperature: {
      type: DataTypes.DECIMAL(4, 1),
      comment: "Temperature in Celsius",
    },
    bloodPressureSystolic: {
      type: DataTypes.INTEGER,
    },
    bloodPressureDiastolic: {
      type: DataTypes.INTEGER,
    },
    heartRate: {
      type: DataTypes.INTEGER,
      comment: "Heart rate in bpm",
    },
    respiratoryRate: {
      type: DataTypes.INTEGER,
      comment: "Respiratory rate per minute",
    },
    oxygenSaturation: {
      type: DataTypes.DECIMAL(5, 2),
      comment: "Oxygen saturation percentage",
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      comment: "Weight in kg",
    },
    height: {
      type: DataTypes.DECIMAL(5, 2),
      comment: "Height in cm",
    },
    bmi: {
      type: DataTypes.DECIMAL(4, 2),
      comment: "Body Mass Index",
    },
    physicalExamination: {
      type: DataTypes.TEXT,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      comment: "Primary and secondary diagnosis",
    },
    investigation: {
      type: DataTypes.TEXT,
      comment: "Investigation notes",
    },
    treatmentPlan: {
      type: DataTypes.TEXT,
    },
    followUpDate: {
      type: DataTypes.DATEONLY,
    },
    doctorNotes: {
      type: DataTypes.TEXT,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
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
    tableName: "visits",
    timestamps: true,
    hooks: {
      beforeValidate: async (visit) => {
        if (!visit.visitNumber) {
          visit.visitNumber = generateVisitNumber();
        }
        if (!visit.arrivalTime) {
          const now = new Date();
          visit.arrivalTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
        }
      },
    },
  },
);

export default Visit;
