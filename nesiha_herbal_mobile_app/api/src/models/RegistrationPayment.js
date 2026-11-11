import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { REGISTRATION_FEE_METHODS } from "../config/constants.js";

// The one-time fee charged when a new patient is registered — collected by
// whoever registers them (a data_clerk or doctor), not a cashier, and not
// tied to a Visit (registration happens before any visit exists). Kept as
// its own table rather than a Payment row because Payment.visitId is
// NOT NULL and processPayment()'s whole flow (visit status transitions,
// prescription dispensing) is visit-shaped and irrelevant here.
const RegistrationPayment = sequelize.define(
  "RegistrationPayment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "patients", key: "id" },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "cash",
      validate: { isIn: [REGISTRATION_FEE_METHODS] },
    },
    transactionId: {
      type: DataTypes.STRING,
    },
    receivedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "registration_payments",
    timestamps: true,
  },
);

export default RegistrationPayment;
