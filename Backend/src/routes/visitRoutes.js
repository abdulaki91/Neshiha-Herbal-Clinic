import express from "express";
import * as visitController from "../controllers/visitController.js";
import * as visitValidator from "../validators/visitValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { ROLES } from "../config/constants.js";
import { uploadSingle, uploadMultiple } from "../middleware/upload.js";

const router = express.Router();

router.use(authenticate);

// Get completed consultations (must be before /:id route)
router.get(
  "/completed",
  authorize(ROLES.DOCTOR),
  visitController.getCompletedConsultations,
);

router.get("/queue", authorize(ROLES.DOCTOR), visitController.getDoctorQueue);

// Upcoming scheduled appointments (must be before /:id route)
router.get(
  "/appointments",
  authorize(ROLES.DATA_CLERK, ROLES.DOCTOR),
  visitValidator.appointmentQueryValidator,
  validate,
  visitController.getAppointments,
);

router.get("/", visitController.getAllVisits);
router.get("/:id", visitController.getVisitById);
router.post(
  "/",
  authorize(ROLES.DATA_CLERK, ROLES.DOCTOR),
  visitValidator.createVisitValidator,
  validate,
  auditLogger("CREATE", "Visit"),
  visitController.createVisit,
);
router.put(
  "/:id",
  authorize(ROLES.DOCTOR, ROLES.DATA_CLERK),
  visitValidator.updateVisitValidator,
  validate,
  auditUpdate("Visit"),
  visitController.updateVisit,
);
router.patch(
  "/:id/status",
  visitValidator.visitStatusValidator,
  validate,
  auditLogger("UPDATE", "Visit"),
  visitController.updateVisitStatus,
);
router.patch(
  "/:id/check-in",
  authorize(ROLES.DATA_CLERK),
  auditLogger("UPDATE", "Visit"),
  visitController.checkInAppointment,
);
router.patch(
  "/:id/assign-doctor",
  authorize(ROLES.DATA_CLERK, ROLES.DOCTOR),
  auditLogger("UPDATE", "Visit"),
  visitController.assignDoctor,
);
router.post(
  "/:id/vitals",
  authorize(ROLES.DOCTOR, ROLES.DATA_CLERK),
  visitValidator.vitalSignsValidator,
  validate,
  auditLogger("UPDATE", "Visit"),
  visitController.recordVitalSigns,
);

// Upload single attachment during consultation
router.post(
  "/:id/attachments",
  authorize(ROLES.DOCTOR, ROLES.DATA_CLERK),
  uploadSingle("document"),
  auditLogger("CREATE", "PatientAttachment"),
  visitController.uploadVisitAttachment,
);

// Upload multiple attachments during consultation
router.post(
  "/:id/attachments/multiple",
  authorize(ROLES.DOCTOR, ROLES.DATA_CLERK),
  uploadMultiple("documents", 10),
  auditLogger("CREATE", "PatientAttachment"),
  visitController.uploadMultipleVisitAttachments,
);

// Get all attachments for a visit
router.get("/:id/attachments", visitController.getVisitAttachments);

export default router;
