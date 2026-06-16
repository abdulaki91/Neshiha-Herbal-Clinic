import express from "express";
import * as patientController from "../controllers/patientController.js";
import * as patientValidator from "../validators/patientValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { uploadSingle } from "../middleware/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get patient statistics
router.get("/stats", patientController.getPatientStats);

// Get all patients
router.get(
  "/",
  patientValidator.patientQueryValidator,
  validate,
  patientController.getAllPatients,
);

// Get patient by ID
router.get("/:id", patientController.getPatientById);

// Get patient complete history
router.get("/:id/history", patientController.getPatientHistory);

// Create new patient
router.post(
  "/",
  authorize(ROLES.DATA_CLERK, ROLES.SUPER_ADMIN),
  patientValidator.createPatientValidator,
  validate,
  auditLogger("CREATE", "Patient"),
  patientController.createPatient,
);

// Update patient
router.put(
  "/:id",
  authorize(ROLES.DATA_CLERK, ROLES.SUPER_ADMIN),
  patientValidator.updatePatientValidator,
  validate,
  auditUpdate("Patient"),
  patientController.updatePatient,
);

// Delete patient (super admin only)
router.delete(
  "/:id",
  authorize(ROLES.SUPER_ADMIN),
  auditLogger("DELETE", "Patient"),
  patientController.deletePatient,
);

// Upload patient photo
router.post(
  "/:id/photo",
  authorize(ROLES.DATA_CLERK, ROLES.SUPER_ADMIN),
  uploadSingle("photo"),
  auditLogger("UPDATE", "Patient"),
  patientController.uploadPhoto,
);

export default router;
