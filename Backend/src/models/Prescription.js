import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import {
  PRESCRIPTION_STATUS,
  MEDICINE_ROUTE,
  MEDICINE_FREQUENCY,
} from "../config/constants.js";

const Prescription = sequelize.define(
  "Prescription",
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
    medicineId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "medicines",
        key: "id",
      },
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    dosage: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "e.g., 500mg, 2 tablets",
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "e.g., twice daily, every 8 hours",
    },
    route: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "e.g., oral, injection",
    },
    duration: {
      type: DataTypes.STRING,
      comment: "e.g., 7 days, 2 weeks",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Total quantity prescribed",
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: "Price per unit",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: "unitPrice * quantity",
    },
    instructions: {
      type: DataTypes.TEXT,
      comment: "Special instructions for patient",
    },
    reason: {
      type: DataTypes.TEXT,
      comment: "Reason for prescription",
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PRESCRIPTION_STATUS)),
      defaultValue: PRESCRIPTION_STATUS.PENDING,
    },
    prescribedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    dispensedDate: {
      type: DataTypes.DATE,
    },
    dispensedBy: {
      type: DataTypes.UUID,
      references: {
        model: "users",
        key: "id",
      },
    },
    completedDate: {
      type: DataTypes.DATE,
    },
    stoppedDate: {
      type: DataTypes.DATE,
    },
    stoppedReason: {
      type: DataTypes.TEXT,
    },
    refills: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    refillsRemaining: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    doctorSignature: {
      type: DataTypes.STRING,
    },
    notes: {
      type: DataTypes.TEXT,
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
    tableName: "prescriptions",
    timestamps: true,
  },
);

export default Prescription;
