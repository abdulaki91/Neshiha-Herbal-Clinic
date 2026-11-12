import express from "express";
import bannerController from "../controllers/bannerController.js";
import * as bannerValidator from "../validators/bannerValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { uploadSingle, attachImagePath, parseJsonFields } from "../middleware/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

router.get(
  "/",
  bannerValidator.collectionQueryValidator,
  validate,
  bannerController.getAll,
);

router.get("/:id", bannerController.getById);

router.post(
  "/",
  uploadSingle("image"),
  attachImagePath("image"),
  parseJsonFields("title", "subtitle", "ctaText"),
  bannerValidator.createBannerValidator,
  validate,
  auditLogger("CREATE", "Banner"),
  bannerController.create,
);

router.put(
  "/:id",
  uploadSingle("image"),
  attachImagePath("image"),
  parseJsonFields("title", "subtitle", "ctaText"),
  bannerValidator.updateBannerValidator,
  validate,
  auditUpdate("Banner"),
  bannerController.update,
);

router.delete("/:id", auditLogger("DELETE", "Banner"), bannerController.remove);

router.patch(
  "/:id/status",
  bannerValidator.setStatusValidator,
  validate,
  auditLogger("UPDATE", "Banner"),
  bannerController.setStatus,
);

router.patch(
  "/:id/reorder",
  bannerValidator.reorderValidator,
  validate,
  bannerController.reorder,
);

export default router;
