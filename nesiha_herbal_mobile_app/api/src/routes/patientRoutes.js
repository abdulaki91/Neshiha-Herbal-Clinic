import express from "express";
import * as patientController from "../controllers/patientController.js";
import * as patientAttachmentController from "../controllers/patientAttachmentController.js";
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
  authorize(ROLES.DATA_CLERK, ROLES.DOCTOR),
  patientValidator.createPatientValidator,
  validate,
  auditLogger("CREATE", "Patient"),
  patientController.createPatient,
);

// Update patient
router.put(
  "/:id",
  authorize(ROLES.DATA_CLERK, ROLES.DOCTOR),
  patientValidator.updatePatientValidator,
  validate,
  auditUpdate("Patient"),
  patientController.updatePatient,
);

// Delete patient (super admin and doctor)
router.delete(
  "/:id",
  authorize(ROLES.DOCTOR),
  auditLogger("DELETE", "Patient"),
  patientController.deletePatient,
);

// Upload patient photo
router.post(
  "/:id/photo",
  authorize(ROLES.DATA_CLERK, ROLES.DOCTOR),
  uploadSingle("photo"),
  auditLogger("UPDATE", "Patient"),
  patientController.uploadPhoto,
);

// Upload patient attachment (laboratory report, photos, etc.)
router.post(
  "/:id/attachments",
  authorize(ROLES.DATA_CLERK, ROLES.DOCTOR),
  uploadSingle("document"),
  auditLogger("UPDATE", "Patient"),
  patientAttachmentController.uploadAttachment,
);

// Get patient attachments
router.get(
  "/:id/attachments",
  patientAttachmentController.getAttachments,
);

// Delete patient attachment
router.delete(
  "/:id/attachments/:attachmentId",
  authorize(ROLES.DOCTOR),
  auditLogger("UPDATE", "Patient"),
  patientAttachmentController.deleteAttachment,
);

export default router;
