import express from "express";
import * as visitController from "../controllers/visitController.js";
import * as visitValidator from "../validators/visitValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);

router.get("/queue", authorize(ROLES.DOCTOR), visitController.getDoctorQueue);
router.get("/", visitController.getAllVisits);
router.get("/:id", visitController.getVisitById);
router.post(
  "/",
  authorize(ROLES.DATA_CLERK, ROLES.SUPER_ADMIN),
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
  "/:id/assign-doctor",
  authorize(ROLES.DATA_CLERK, ROLES.SUPER_ADMIN),
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

export default router;
