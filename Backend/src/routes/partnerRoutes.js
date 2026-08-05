import express from "express";
import partnerController from "../controllers/partnerController.js";
import * as partnerValidator from "../validators/partnerValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { uploadSingle, attachImagePath } from "../middleware/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

router.get(
  "/",
  partnerValidator.collectionQueryValidator,
  validate,
  partnerController.getAll,
);

router.get("/:id", partnerController.getById);

router.post(
  "/",
  uploadSingle("image"),
  attachImagePath("logo"),
  partnerValidator.createPartnerValidator,
  validate,
  auditLogger("CREATE", "Partner"),
  partnerController.create,
);

router.put(
  "/:id",
  uploadSingle("image"),
  attachImagePath("logo"),
  partnerValidator.updatePartnerValidator,
  validate,
  auditUpdate("Partner"),
  partnerController.update,
);

router.delete("/:id", auditLogger("DELETE", "Partner"), partnerController.remove);

router.patch(
  "/:id/status",
  partnerValidator.setStatusValidator,
  validate,
  auditLogger("UPDATE", "Partner"),
  partnerController.setStatus,
);

router.patch(
  "/:id/reorder",
  partnerValidator.reorderValidator,
  validate,
  partnerController.reorder,
);

export default router;
