import express from "express";
import * as staffController from "../controllers/staffController.js";
import * as staffValidator from "../validators/staffValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get staff statistics
router.get(
  "/stats",
  authorize(ROLES.SUPER_ADMIN, ROLES.STAFF_MANAGER),
  staffController.getStaffStats,
);

// Get all staff
router.get(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.STAFF_MANAGER),
  staffValidator.staffQueryValidator,
  validate,
  staffController.getAllStaff,
);

// Get staff by ID
router.get("/:id", staffController.getStaffById);

// Create new staff
router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.STAFF_MANAGER),
  staffValidator.createStaffValidator,
  validate,
  auditLogger("CREATE", "User"),
  staffController.createStaff,
);

// Update staff
router.put(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.STAFF_MANAGER),
  staffValidator.updateStaffValidator,
  validate,
  auditUpdate("User"),
  staffController.updateStaff,
);

// Delete staff (super admin only)
router.delete(
  "/:id",
  authorize(ROLES.SUPER_ADMIN),
  auditLogger("DELETE", "User"),
  staffController.deleteStaff,
);

// Activate staff
router.patch(
  "/:id/activate",
  authorize(ROLES.SUPER_ADMIN, ROLES.STAFF_MANAGER),
  auditLogger("UPDATE", "User"),
  staffController.activateStaff,
);

// Deactivate staff
router.patch(
  "/:id/deactivate",
  authorize(ROLES.SUPER_ADMIN, ROLES.STAFF_MANAGER),
  auditLogger("UPDATE", "User"),
  staffController.deactivateStaff,
);

export default router;
