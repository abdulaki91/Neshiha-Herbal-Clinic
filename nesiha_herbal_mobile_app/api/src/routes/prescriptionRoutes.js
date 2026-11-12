import express from "express";
import * as prescriptionController from "../controllers/prescriptionController.js";
import * as prescriptionValidator from "../validators/prescriptionValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger } from "../middleware/audit.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);

router.get("/", prescriptionController.getAllPrescriptions);
router.get("/:id", prescriptionController.getPrescriptionById);
router.post(
  "/",
  authorize(ROLES.DOCTOR),
  prescriptionValidator.createPrescriptionValidator,
  validate,
  auditLogger("CREATE", "Prescription"),
  prescriptionController.createPrescription,
);
router.post(
  "/:id/dispense",
  authorize(ROLES.DOCTOR, ROLES.CASHIER),
  prescriptionValidator.dispenseMedicineValidator,
  validate,
  auditLogger("UPDATE", "Prescription"),
  prescriptionController.dispenseMedicine,
);
router.patch(
  "/:id/stop",
  authorize(ROLES.DOCTOR),
  auditLogger("UPDATE", "Prescription"),
  prescriptionController.stopPrescription,
);

export default router;
