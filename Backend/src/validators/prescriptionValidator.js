import { body } from "express-validator";

export const createPrescriptionValidator = [
  body("visitId").notEmpty().withMessage("Visit ID is required"),
  body("patientId").notEmpty().withMessage("Patient ID is required"),
  body("medicineId").notEmpty().withMessage("Medicine ID is required"),
  body("dosage").trim().notEmpty().withMessage("Dosage is required"),
  body("frequency").trim().notEmpty().withMessage("Frequency is required"),
  body("route").trim().notEmpty().withMessage("Route is required"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

export const dispenseMedicineValidator = [
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];
