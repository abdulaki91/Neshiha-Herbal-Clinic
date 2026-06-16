import { body, query } from "express-validator";

export const createMedicineValidator = [
  body("name").trim().notEmpty().withMessage("Medicine name is required"),
  body("strength").optional().trim(),
  body("dosageForm").optional().trim(),
  body("category").optional().trim(),
  body("manufacturer").optional().trim(),
  body("expiryDate").optional().isDate().withMessage("Invalid expiry date"),
  body("availableQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Invalid quantity"),
  body("minimumStock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Invalid minimum stock"),
];

export const updateMedicineValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Medicine name cannot be empty"),
  body("availableQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Invalid quantity"),
  body("minimumStock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Invalid minimum stock"),
];
