import { body, query } from "express-validator";

export const createMedicineValidator = [
  body("name").trim().notEmpty().withMessage("Medicine name is required"),
  body("code").optional().trim(),
  body("genericName").optional().trim(),
  body("strength").optional().trim(),
  body("dosageForm").optional().trim(),
  body("category").optional().trim(),
  body("manufacturer").optional().trim(),
  body("supplier").optional().trim(),
  body("batchNumber").optional().trim(),
  body("storageLocation").optional().trim(),
  body("sideEffects").optional().trim(),
  body("contraindications").optional().trim(),
  body("instructions").optional().trim(),
  body("notes").optional().trim(),
  body("expiryDate").optional().isDate().withMessage("Invalid expiry date"),
  body("purchasePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid purchase price"),
  body("sellingPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid selling price"),
  body("availableQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Invalid quantity"),
  body("minimumStock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Invalid minimum stock"),
  body("requiresPrescription")
    .optional()
    .isBoolean()
    .withMessage("Invalid value for requiresPrescription"),
];

export const updateMedicineValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Medicine name cannot be empty"),
  body("code").optional().trim(),
  body("genericName").optional().trim(),
  body("strength").optional().trim(),
  body("dosageForm").optional().trim(),
  body("category").optional().trim(),
  body("manufacturer").optional().trim(),
  body("supplier").optional().trim(),
  body("batchNumber").optional().trim(),
  body("storageLocation").optional().trim(),
  body("sideEffects").optional().trim(),
  body("contraindications").optional().trim(),
  body("instructions").optional().trim(),
  body("notes").optional().trim(),
  body("expiryDate").optional().isDate().withMessage("Invalid expiry date"),
  body("purchasePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid purchase price"),
  body("sellingPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid selling price"),
  body("availableQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Invalid quantity"),
  body("minimumStock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Invalid minimum stock"),
  body("requiresPrescription")
    .optional()
    .isBoolean()
    .withMessage("Invalid value for requiresPrescription"),
];
