import express from "express";
import * as bookingRequestController from "../controllers/bookingRequestController.js";
import * as bookingRequestValidator from "../validators/bookingRequestValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger } from "../middleware/audit.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// Public: anyone can submit a "Book Appointment" request from the website
// — this is the one route in this file with no authenticate/authorize.
router.post(
  "/",
  bookingRequestValidator.createBookingRequestValidator,
  validate,
  bookingRequestController.create,
);

// Everything below is staff-only — reviewing and actioning requests.
router.get(
  "/",
  authenticate,
  authorize(ROLES.DATA_CLERK, ROLES.DOCTOR),
  bookingRequestValidator.bookingQueryValidator,
  validate,
  bookingRequestController.getAll,
);

router.get(
  "/pending-count",
  authenticate,
  authorize(ROLES.DATA_CLERK, ROLES.DOCTOR),
  bookingRequestController.getPendingCount,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.DATA_CLERK, ROLES.DOCTOR),
  bookingRequestController.getById,
);

router.patch(
  "/:id/status",
  authenticate,
  authorize(ROLES.DATA_CLERK, ROLES.DOCTOR),
  bookingRequestValidator.updateStatusValidator,
  validate,
  auditLogger("UPDATE", "BookingRequest"),
  bookingRequestController.updateStatus,
);

export default router;
