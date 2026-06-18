import { body } from "express-validator";

export const createPrescriptionValidator = [
  body("visitId").notEmpty().withMessage("Visit ID is required"),
  body("patientId").notEmpty().withMessage("Patient ID is required"),
  body("medicineId").notEmpty().withMessage("Medicine ID is required"),
  body("dosage").optional().trim(),
  body("frequency").optional().trim(),
  body("route").optional().trim(),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("unitPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid unit price"),
  body("totalAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid total amount"),
];

export const dispenseMedicineValidator = [
  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
];
