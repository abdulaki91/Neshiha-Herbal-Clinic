import express from "express";
import testimonialController from "../controllers/testimonialController.js";
import * as testimonialValidator from "../validators/testimonialValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { uploadSingle, attachImagePath, parseJsonFields } from "../middleware/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// Every route here manages public-website content — super admin only.
router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

router.get(
  "/",
  testimonialValidator.collectionQueryValidator,
  validate,
  testimonialController.getAll,
);

router.get("/:id", testimonialController.getById);

router.post(
  "/",
  uploadSingle("image"),
  attachImagePath("clientPhoto"),
  parseJsonFields("role", "text"),
  testimonialValidator.createTestimonialValidator,
  validate,
  auditLogger("CREATE", "Testimonial"),
  testimonialController.create,
);

router.put(
  "/:id",
  uploadSingle("image"),
  attachImagePath("clientPhoto"),
  parseJsonFields("role", "text"),
  testimonialValidator.updateTestimonialValidator,
  validate,
  auditUpdate("Testimonial"),
  testimonialController.update,
);

router.delete(
  "/:id",
  auditLogger("DELETE", "Testimonial"),
  testimonialController.remove,
);

router.patch(
  "/:id/status",
  testimonialValidator.setStatusValidator,
  validate,
  auditLogger("UPDATE", "Testimonial"),
  testimonialController.setStatus,
);

router.patch(
  "/:id/reorder",
  testimonialValidator.reorderValidator,
  validate,
  testimonialController.reorder,
);

export default router;
