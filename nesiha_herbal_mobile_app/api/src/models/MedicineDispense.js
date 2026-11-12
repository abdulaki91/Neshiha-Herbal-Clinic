import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const MedicineDispense = sequelize.define(
  "MedicineDispense",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prescriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "prescriptions",
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
    visitId: {
      type: DataTypes.UUID,
      references: {
        model: "visits",
        key: "id",
      },
    },
    dispensedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dosage: {
      type: DataTypes.STRING,
    },
    frequency: {
      type: DataTypes.STRING,
    },
    route: {
      type: DataTypes.STRING,
    },
    duration: {
      type: DataTypes.STRING,
    },
    instructions: {
      type: DataTypes.TEXT,
    },
    reason: {
      type: DataTypes.TEXT,
    },
    dispensedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    dispensedTime: {
      type: DataTypes.TIME,
    },
    batchNumber: {
      type: DataTypes.STRING,
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "medicine_dispenses",
    timestamps: true,
    hooks: {
      beforeValidate: async (dispense) => {
        if (!dispense.dispensedTime) {
          const now = new Date();
          dispense.dispensedTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
        }
      },
    },
  },
);

export default MedicineDispense;
