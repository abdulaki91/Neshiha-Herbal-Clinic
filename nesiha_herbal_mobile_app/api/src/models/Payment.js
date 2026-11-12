import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    paymentNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM("cash", "transfer", "mobile_money", "other"),
      defaultValue: "cash",
    },
    status: {
      type: DataTypes.ENUM("pending", "paid", "partially_paid", "refunded", "cancelled"),
      defaultValue: "pending",
    },
    transactionId: {
      type: DataTypes.STRING,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    cashierId: {
      type: DataTypes.UUID,
      references: {
        model: "users",
        key: "id",
      },
    },
    paidAt: {
      type: DataTypes.DATE,
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
    tableName: "payments",
    timestamps: true,
  },
);

export default Payment;
