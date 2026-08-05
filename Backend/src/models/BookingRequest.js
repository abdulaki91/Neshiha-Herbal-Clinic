import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// A booking request is a lightweight, anonymous submission from the public
// website — deliberately NOT a Patient/Visit record. The clinic's patient
// registration collects far more (age, gender, allergies, ...) than a
// public visitor should ever type into a web form, so staff review each
// request and manually register the patient + schedule the real visit
// through the existing Patients/Visits flow once they've made contact.
const BookingRequest = sequelize.define(
  "BookingRequest",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
    },
    preferredDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    preferredTime: {
      type: DataTypes.STRING,
    },
    reason: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "contacted", "confirmed", "declined", "converted"]],
      },
    },
    staffNotes: {
      type: DataTypes.TEXT,
    },
    reviewedBy: {
      type: DataTypes.UUID,
      references: { model: "users", key: "id" },
    },
    convertedVisitId: {
      type: DataTypes.UUID,
      references: { model: "visits", key: "id" },
    },
  },
  {
    tableName: "booking_requests",
    timestamps: true,
  },
);

export default BookingRequest;
