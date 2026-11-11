import { body, query } from "express-validator";
import { ROLES, USER_STATUS } from "../config/constants.js";

const ROLE_VALUES = Object.values(ROLES);
const STATUS_VALUES = Object.values(USER_STATUS);

const passwordRules = (chain) =>
  chain
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    );

export const createStaffValidator = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  passwordRules(body("password")),
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("role").isIn(ROLE_VALUES).withMessage("Invalid role"),
  body("status").optional().isIn(STATUS_VALUES).withMessage("Invalid status"),
  body("department").optional().trim(),
  body("specialization").optional().trim(),
  body("licenseNumber").optional().trim(),
  body("address").optional().trim(),
];

export const updateStaffValidator = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
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
  body("phone").optional().trim(),
  body("role").optional().isIn(ROLE_VALUES).withMessage("Invalid role"),
  body("status").optional().isIn(STATUS_VALUES).withMessage("Invalid status"),
  body("department").optional().trim(),
  body("specialization").optional().trim(),
  body("licenseNumber").optional().trim(),
  body("address").optional().trim(),
];

export const resetStaffPasswordValidator = [passwordRules(body("password"))];

export const staffQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Page size must be between 1 and 100"),
  query("role").optional().isIn(ROLE_VALUES).withMessage("Invalid role"),
  query("status").optional().isIn(STATUS_VALUES).withMessage("Invalid status"),
];
