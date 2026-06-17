import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/pending",
  authorize(ROLES.CASHIER, ROLES.SUPER_ADMIN),
  paymentController.getPendingPayments,
);

router.get(
  "/history",
  authorize(ROLES.CASHIER, ROLES.SUPER_ADMIN),
  paymentController.getPaymentHistory,
);

router.get(
  "/:visitId",
  authorize(ROLES.CASHIER, ROLES.SUPER_ADMIN),
  paymentController.getPaymentDetails,
);

router.post(
  "/:visitId",
  authorize(ROLES.CASHIER, ROLES.SUPER_ADMIN),
  paymentController.processPayment,
);

export default router;
