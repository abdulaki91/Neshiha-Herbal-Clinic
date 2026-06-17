import sequelize from "../config/database.js";
import User from "./User.js";
import Patient from "./Patient.js";
import Visit from "./Visit.js";
import Medicine from "./Medicine.js";
import Prescription from "./Prescription.js";
import MedicineDispense from "./MedicineDispense.js";
import Investigation from "./Investigation.js";
import AuditLog from "./AuditLog.js";
import Notification from "./Notification.js";
import Setting from "./Setting.js";
import Payment from "./Payment.js";

// Define Associations

// User associations
User.hasMany(Patient, { foreignKey: "registeredBy", as: "registeredPatients" });
User.hasMany(Visit, { foreignKey: "createdBy", as: "createdVisits" });
User.hasMany(Visit, { foreignKey: "doctorId", as: "doctorVisits" });
User.hasMany(Prescription, { foreignKey: "doctorId", as: "prescriptions" });
User.hasMany(Investigation, {
  foreignKey: "requestedBy",
  as: "requestedInvestigations",
});
User.hasMany(MedicineDispense, {
  foreignKey: "dispensedBy",
  as: "dispensedMedicines",
});
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
User.hasMany(Payment, { foreignKey: "cashierId", as: "processedPayments" });

// Patient associations
Patient.belongsTo(User, { foreignKey: "registeredBy", as: "registeredByUser" });
Patient.hasMany(Visit, { foreignKey: "patientId", as: "visits" });
Patient.hasMany(Prescription, { foreignKey: "patientId", as: "prescriptions" });
Patient.hasMany(Investigation, {
  foreignKey: "patientId",
  as: "investigations",
});
Patient.hasMany(MedicineDispense, {
  foreignKey: "patientId",
  as: "medicineDispenses",
});
Patient.hasMany(Payment, { foreignKey: "patientId", as: "payments" });

// Visit associations
Visit.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
Visit.belongsTo(User, { foreignKey: "doctorId", as: "doctor" });
Visit.belongsTo(User, { foreignKey: "createdBy", as: "createdByUser" });
Visit.hasMany(Prescription, { foreignKey: "visitId", as: "prescriptions" });
Visit.hasMany(Investigation, { foreignKey: "visitId", as: "investigations" });
Visit.hasMany(MedicineDispense, {
  foreignKey: "visitId",
  as: "medicineDispenses",
});
Visit.hasMany(Payment, { foreignKey: "visitId", as: "payments" });

// Medicine associations
Medicine.hasMany(Prescription, {
  foreignKey: "medicineId",
  as: "prescriptions",
});
Medicine.hasMany(MedicineDispense, {
  foreignKey: "medicineId",
  as: "dispenses",
});

// Prescription associations
Prescription.belongsTo(Visit, { foreignKey: "visitId", as: "visit" });
Prescription.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
Prescription.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicine" });
Prescription.belongsTo(User, { foreignKey: "doctorId", as: "doctor" });
Prescription.belongsTo(User, {
  foreignKey: "dispensedBy",
  as: "dispensedByUser",
});
Prescription.hasMany(MedicineDispense, {
  foreignKey: "prescriptionId",
  as: "dispenses",
});

// MedicineDispense associations
MedicineDispense.belongsTo(Prescription, {
  foreignKey: "prescriptionId",
  as: "prescription",
});
MedicineDispense.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
MedicineDispense.belongsTo(Medicine, {
  foreignKey: "medicineId",
  as: "medicine",
});
MedicineDispense.belongsTo(Visit, { foreignKey: "visitId", as: "visit" });
MedicineDispense.belongsTo(User, {
  foreignKey: "dispensedBy",
  as: "dispensedByUser",
});

// Investigation associations
Investigation.belongsTo(Visit, { foreignKey: "visitId", as: "visit" });
Investigation.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
Investigation.belongsTo(User, {
  foreignKey: "requestedBy",
  as: "requestedByUser",
});
Investigation.belongsTo(User, {
  foreignKey: "reviewedBy",
  as: "reviewedByUser",
});

// Payment associations
Payment.belongsTo(Visit, { foreignKey: "visitId", as: "visit" });
Payment.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
Payment.belongsTo(User, { foreignKey: "cashierId", as: "cashier" });

// Notification associations
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

// Export models and sequelize instance
export {
  sequelize,
  User,
  Patient,
  Visit,
  Medicine,
  Prescription,
  MedicineDispense,
  Investigation,
  AuditLog,
  Notification,
  Setting,
  Payment,
};

// Sync database (development only)
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log("✅ Database synchronized successfully.");
  } catch (error) {
    console.error("❌ Database synchronization failed:", error);
    throw error;
  }
};
