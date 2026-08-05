import express from "express";
import * as settingController from "../controllers/settingController.js";
import * as settingValidator from "../validators/settingValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger } from "../middleware/audit.js";
import { uploadSingle } from "../middleware/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);

router.get("/", settingController.getSettings);
router.put(
  "/",
  authorize(ROLES.SUPER_ADMIN),
  settingValidator.updateSettingsValidator,
  validate,
  auditLogger("UPDATE", "Setting"),
  settingController.updateSettings,
);
router.post(
  "/logo",
  authorize(ROLES.SUPER_ADMIN),
  uploadSingle("logo"),
  auditLogger("UPDATE", "Setting"),
  settingController.uploadLogo,
);

export default router;
