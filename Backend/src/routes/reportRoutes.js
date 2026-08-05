import express from "express";
import * as reportController from "../controllers/reportController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.STAFF_MANAGER, ROLES.DOCTOR, ROLES.CASHIER));

router.get("/patients", reportController.getPatientReport);
router.get("/visits", reportController.getVisitReport);
router.get("/medicines", reportController.getMedicineReport);
router.get("/daily", reportController.getDailyReport);
router.get("/monthly", reportController.getMonthlyReport);
router.get("/yearly", reportController.getYearlyReport);
router.get("/revenue", reportController.getRevenueReport);

export default router;
