import express from "express";
import * as dashboardController from "../controllers/dashboardController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);

// Staff managers land here too — the payload is operational counts only
router.get(
  "/admin",
  authorize(ROLES.SUPER_ADMIN, ROLES.STAFF_MANAGER),
  dashboardController.getAdminDashboard,
);
router.get(
  "/doctor",
  authorize(ROLES.DOCTOR),
  dashboardController.getDoctorDashboard,
);
router.get(
  "/clerk",
  authorize(ROLES.DATA_CLERK),
  dashboardController.getClerkDashboard,
);
router.get(
  "/cashier",
  authorize(ROLES.CASHIER),
  dashboardController.getCashierDashboard,
);

export default router;
