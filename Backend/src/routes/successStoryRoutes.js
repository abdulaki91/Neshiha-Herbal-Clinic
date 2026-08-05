import express from "express";
import successStoryController from "../controllers/successStoryController.js";
import * as successStoryValidator from "../validators/successStoryValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { uploadMultiple, attachImagePaths } from "../middleware/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

router.get(
  "/",
  successStoryValidator.collectionQueryValidator,
  validate,
  successStoryController.getAll,
);

router.get("/:id", successStoryController.getById);

router.post(
  "/",
  uploadMultiple("images", 8),
  attachImagePaths("images"),
  successStoryValidator.createSuccessStoryValidator,
  validate,
  auditLogger("CREATE", "SuccessStory"),
  successStoryController.create,
);

router.put(
  "/:id",
  uploadMultiple("images", 8),
  attachImagePaths("images"),
  successStoryValidator.updateSuccessStoryValidator,
  validate,
  auditUpdate("SuccessStory"),
  successStoryController.update,
);

router.delete(
  "/:id",
  auditLogger("DELETE", "SuccessStory"),
  successStoryController.remove,
);

router.patch(
  "/:id/status",
  successStoryValidator.setStatusValidator,
  validate,
  auditLogger("UPDATE", "SuccessStory"),
  successStoryController.setStatus,
);

router.patch(
  "/:id/reorder",
  successStoryValidator.reorderValidator,
  validate,
  successStoryController.reorder,
);

export default router;
