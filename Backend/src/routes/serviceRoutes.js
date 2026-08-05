import express from "express";
import serviceController from "../controllers/serviceController.js";
import * as serviceValidator from "../validators/serviceValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

router.get(
  "/",
  serviceValidator.collectionQueryValidator,
  validate,
  serviceController.getAll,
);

router.get("/:id", serviceController.getById);

router.post(
  "/",
  serviceValidator.createServiceValidator,
  validate,
  auditLogger("CREATE", "Service"),
  serviceController.create,
);

router.put(
  "/:id",
  serviceValidator.updateServiceValidator,
  validate,
  auditUpdate("Service"),
  serviceController.update,
);

router.delete("/:id", auditLogger("DELETE", "Service"), serviceController.remove);

router.patch(
  "/:id/status",
  serviceValidator.setStatusValidator,
  validate,
  auditLogger("UPDATE", "Service"),
  serviceController.setStatus,
);

router.patch(
  "/:id/reorder",
  serviceValidator.reorderValidator,
  validate,
  serviceController.reorder,
);

export default router;
