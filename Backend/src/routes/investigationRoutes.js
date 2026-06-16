import express from "express";
import * as investigationController from "../controllers/investigationController.js";
import * as investigationValidator from "../validators/investigationValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { uploadSingle } from "../middleware/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);

router.get("/", investigationController.getAllInvestigations);
router.get("/:id", investigationController.getInvestigationById);
router.post(
  "/",
  authorize(ROLES.DOCTOR),
  investigationValidator.createInvestigationValidator,
  validate,
  auditLogger("CREATE", "Investigation"),
  investigationController.createInvestigation,
);
router.put(
  "/:id",
  authorize(ROLES.DOCTOR),
  investigationValidator.updateInvestigationValidator,
  validate,
  auditUpdate("Investigation"),
  investigationController.updateInvestigation,
);
router.post(
  "/:id/results",
  authorize(ROLES.DOCTOR),
  uploadSingle("resultFile"),
  auditLogger("UPDATE", "Investigation"),
  investigationController.addResults,
);

export default router;
