import express from "express";
import faqController from "../controllers/faqController.js";
import * as faqValidator from "../validators/faqValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

router.get("/", faqValidator.collectionQueryValidator, validate, faqController.getAll);
router.get("/:id", faqController.getById);

router.post(
  "/",
  faqValidator.createFaqValidator,
  validate,
  auditLogger("CREATE", "Faq"),
  faqController.create,
);

router.put(
  "/:id",
  faqValidator.updateFaqValidator,
  validate,
  auditUpdate("Faq"),
  faqController.update,
);

router.delete("/:id", auditLogger("DELETE", "Faq"), faqController.remove);

router.patch(
  "/:id/status",
  faqValidator.setStatusValidator,
  validate,
  auditLogger("UPDATE", "Faq"),
  faqController.setStatus,
);

router.patch(
  "/:id/reorder",
  faqValidator.reorderValidator,
  validate,
  faqController.reorder,
);

export default router;
