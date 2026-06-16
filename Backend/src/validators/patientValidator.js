import { body, query } from "express-validator";

export const createPatientValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("middleName").optional().trim(),
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
  body("dateOfBirth").isDate().withMessage("Invalid date of birth"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("email").optional().isEmail().withMessage("Invalid email"),
  body("nationalId").optional().trim(),
  body("bloodGroup")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"])
    .withMessage("Invalid blood group"),
  body("maritalStatus")
    .optional()
    .isIn(["single", "married", "divorced", "widowed"])
    .withMessage("Invalid marital status"),
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
  body("dateOfBirth").optional().isDate().withMessage("Invalid date of birth"),
  body("email").optional().isEmail().withMessage("Invalid email"),
  body("bloodGroup")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"])
    .withMessage("Invalid blood group"),
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
