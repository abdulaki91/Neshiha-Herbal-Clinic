import express from "express";
import * as medicineDispenseController from "../controllers/medicineDispenseController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create dispense record (Doctor, Pharmacist roles could be added)
router.post(
  "/",
  authorize(ROLES.DOCTOR),
  medicineDispenseController.createDispense,
);

// Get all dispenses with filters
router.get("/", medicineDispenseController.getAllDispenses);

// Get dispense by ID
router.get("/:id", medicineDispenseController.getDispenseById);

// Get dispenses by patient
router.get(
  "/patient/:patientId",
  medicineDispenseController.getDispensesByPatient,
);

// Get dispenses by prescription
router.get(
  "/prescription/:prescriptionId",
  medicineDispenseController.getDispensesByPrescription,
);

export default router;
