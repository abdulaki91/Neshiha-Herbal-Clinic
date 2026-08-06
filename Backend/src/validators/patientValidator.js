import { body, query } from "express-validator";
import { REGISTRATION_FEE_METHODS } from "../config/constants.js";

export const createPatientValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
  body("age")
    .isInt({ min: 0, max: 150 })
    .withMessage("Invalid age"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("email").optional().isEmail().withMessage("Invalid email"),
  body("nationalId").optional().trim(),
  body("maritalStatus")
    .optional()
    .isIn(["single", "married", "divorced", "widowed"])
    .withMessage("Invalid marital status"),
  // Every new patient must pay the registration fee at intake — see
  // REGISTRATION_FEE_AMOUNT in constants.js (the amount itself is never
  // accepted from the client, only how it was paid).
  body("registrationFeeMethod")
    .isIn(REGISTRATION_FEE_METHODS)
    .withMessage("Registration fee payment method is required"),
  body("registrationFeeTransactionId").optional().trim(),
];

export const updatePatientValidator = [
  body("firstName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty"),
  body("lastName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Last name cannot be empty"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
  body("age").optional().isInt({ min: 0, max: 150 }).withMessage("Invalid age"),
  body("email").optional().isEmail().withMessage("Invalid email"),
];

export const patientQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Page size must be between 1 and 100"),
  query("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
];
