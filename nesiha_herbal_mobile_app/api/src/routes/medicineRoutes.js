import express from "express";
import * as medicineController from "../controllers/medicineController.js";
import * as medicineValidator from "../validators/medicineValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);

router.get("/low-stock", medicineController.getLowStockMedicines);
router.get("/expired", medicineController.getExpiredMedicines);
router.get("/stats", medicineController.getMedicineStats);
router.get("/", medicineController.getAllMedicines);
router.get("/:id", medicineController.getMedicineById);
router.post(
  "/",
  authorize(ROLES.DOCTOR, ROLES.DATA_CLERK),
  medicineValidator.createMedicineValidator,
  validate,
  auditLogger("CREATE", "Medicine"),
  medicineController.createMedicine,
);
router.put(
  "/:id",
  authorize(ROLES.DOCTOR, ROLES.DATA_CLERK),
  medicineValidator.updateMedicineValidator,
  validate,
  auditUpdate("Medicine"),
  medicineController.updateMedicine,
);
router.delete(
  "/:id",
  authorize(ROLES.DOCTOR, ROLES.DATA_CLERK),
  auditLogger("DELETE", "Medicine"),
  medicineController.deleteMedicine,
);
router.patch(
  "/:id/adjust-stock",
  authorize(ROLES.DOCTOR),
  auditLogger("UPDATE", "Medicine"),
  medicineController.adjustStock,
);

export default router;
