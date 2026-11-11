import { body, query } from "express-validator";

export const createVisitValidator = [
  body("patientId").notEmpty().withMessage("Patient ID is required"),
  body("chiefComplaint").optional().trim(),
  body("visitDate").optional().isDate().withMessage("Invalid date"),
  // Only these two are valid at creation time — every other status is reached
  // through the consultation/payment workflow, never set directly by a client
  body("status")
    .optional()
    .isIn(["waiting", "scheduled"])
    .withMessage("Invalid status"),
  body("scheduledTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage("Invalid time, expected HH:mm"),
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
    .isIn([
      "scheduled",
      "waiting",
      "in_consultation",
      "completed",
      "cancelled",
    ])
    .withMessage("Invalid status"),
];

export const appointmentQueryValidator = [
  query("startDate").optional().isDate().withMessage("Invalid start date"),
  query("endDate").optional().isDate().withMessage("Invalid end date"),
  query("doctorId").optional().trim(),
  query("search").optional().trim(),
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
