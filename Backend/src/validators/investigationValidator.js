import { body } from "express-validator";

export const createInvestigationValidator = [
  body("visitId").notEmpty().withMessage("Visit ID is required"),
  body("patientId").notEmpty().withMessage("Patient ID is required"),
  body("investigationType")
    .trim()
    .notEmpty()
    .withMessage("Investigation type is required"),
  body("testName").trim().notEmpty().withMessage("Test name is required"),
  body("urgency")
    .optional()
    .isIn(["routine", "urgent", "stat"])
    .withMessage("Invalid urgency"),
];

export const updateInvestigationValidator = [
  body("results").optional().trim(),
  body("interpretation").optional().trim(),
  body("status")
    .optional()
    .isIn(["requested", "in_progress", "completed", "cancelled"])
    .withMessage("Invalid status"),
];
