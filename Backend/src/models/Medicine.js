import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { MEDICINE_STATUS } from "../config/constants.js";
import { generateMedicineId } from "../utils/helpers.js";

const Medicine = sequelize.define(
  "Medicine",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    medicineId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    barcode: {
      type: DataTypes.STRING,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    genericName: {
      type: DataTypes.STRING,
    },
    strength: {
      type: DataTypes.STRING,
      comment: "e.g., 500mg, 10ml",
    },
    dosageForm: {
      type: DataTypes.STRING,
      comment: "e.g., Tablet, Capsule, Syrup, Injection",
    },
    category: {
      type: DataTypes.STRING,
      comment: "e.g., Antibiotic, Analgesic, Antihypertensive",
    },
    manufacturer: {
      type: DataTypes.STRING,
    },
    supplier: {
      type: DataTypes.STRING,
    },
    batchNumber: {
      type: DataTypes.STRING,
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(10, 2),
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
    },
    availableQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    minimumStock: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    storageLocation: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(MEDICINE_STATUS)),
      defaultValue: MEDICINE_STATUS.AVAILABLE,
    },
    requiresPrescription: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    sideEffects: {
      type: DataTypes.TEXT,
    },
    contraindications: {
      type: DataTypes.TEXT,
    },
    instructions: {
      type: DataTypes.TEXT,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: "medicines",
    timestamps: true,
    hooks: {
      beforeValidate: async (medicine) => {
        if (!medicine.medicineId) {
          medicine.medicineId = generateMedicineId();
        }
      },
      beforeUpdate: async (medicine) => {
        // Auto-update status based on quantity and expiry
        if (
          medicine.changed("availableQuantity") ||
          medicine.changed("expiryDate")
        ) {
          const today = new Date();
          const expiry = medicine.expiryDate
            ? new Date(medicine.expiryDate)
            : null;

          if (expiry && expiry < today) {
            medicine.status = MEDICINE_STATUS.EXPIRED;
          } else if (medicine.availableQuantity === 0) {
            medicine.status = MEDICINE_STATUS.OUT_OF_STOCK;
          } else if (medicine.availableQuantity <= medicine.minimumStock) {
            medicine.status = MEDICINE_STATUS.LOW_STOCK;
          } else {
            medicine.status = MEDICINE_STATUS.AVAILABLE;
          }
        }
      },
    },
  },
);

export default Medicine;
