import { body, query } from "express-validator";

export const createStaffValidator = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("role")
    .isIn(["super_admin", "staff_manager", "data_clerk", "doctor"])
    .withMessage("Invalid role"),
  body("department").optional().trim(),
  body("specialization").optional().trim(),
  body("licenseNumber").optional().trim(),
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
  body("role")
    .optional()
    .isIn(["super_admin", "staff_manager", "data_clerk", "doctor"])
    .withMessage("Invalid role"),
];

export const staffQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Page size must be between 1 and 100"),
  query("role")
    .optional()
    .isIn(["super_admin", "staff_manager", "data_clerk", "doctor"])
    .withMessage("Invalid role"),
  query("status")
    .optional()
    .isIn(["active", "inactive", "suspended"])
    .withMessage("Invalid status"),
];
