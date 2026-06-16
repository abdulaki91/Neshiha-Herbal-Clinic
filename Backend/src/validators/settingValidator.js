import { body } from "express-validator";

export const updateSettingsValidator = [
  body("clinicName").optional().trim(),
  body("clinicPhone").optional().trim(),
  body("clinicEmail").optional().isEmail().withMessage("Invalid email"),
  body("lowStockThreshold")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Invalid threshold"),
  body("enableEmailNotifications").optional().isBoolean(),
  body("enableSMSNotifications").optional().isBoolean(),
];
