import { body, query } from "express-validator";

export const createVisitValidator = [
  body("patientId").notEmpty().withMessage("Patient ID is required"),
  body("chiefComplaint").optional().trim(),
  body("visitDate").optional().isDate().withMessage("Invalid date"),
];

export const updateVisitValidator = [
  body("chiefComplaint").optional().trim(),
  body("symptoms").optional(),
  body("historyOfPresentIllness").optional().trim(),
  body("pastHistory").optional().trim(),
  body("physicalExamination").optional().trim(),
  body("diagnosis").optional(),
  body("treatmentPlan").optional().trim(),
  body("doctorNotes").optional().trim(),
  body("followUpDate").optional(),
  body("status").optional().trim(),
  body("consultationStartTime").optional().trim(),
  body("consultationEndTime").optional().trim(),
];

export const visitStatusValidator = [
  body("status")
    .isIn(["waiting", "in_consultation", "completed", "cancelled"])
    .withMessage("Invalid status"),
];

export const vitalSignsValidator = [
  body("temperature").optional().isFloat().withMessage("Invalid temperature"),
  body("bloodPressureSystolic")
    .optional()
    .isInt()
    .withMessage("Invalid blood pressure"),
  body("bloodPressureDiastolic")
    .optional()
    .isInt()
    .withMessage("Invalid blood pressure"),
  body("heartRate").optional().isInt().withMessage("Invalid heart rate"),
  body("weight").optional().isFloat().withMessage("Invalid weight"),
  body("height").optional().isFloat().withMessage("Invalid height"),
];
