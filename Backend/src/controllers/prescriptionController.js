import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as prescriptionService from "../services/prescriptionService.js";
import { emitPrescriptionCreated, emitMedicineDispensed } from "../config/socket.js";

export const getAllPrescriptions = asyncHandler(async (req, res) => {
  const result = await prescriptionService.getAllPrescriptions(req.query);
  return ApiResponse.paginated(
    res,
    result.prescriptions,
    result.pagination,
    "Prescriptions retrieved successfully",
  );
});

export const getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await prescriptionService.getPrescriptionById(
    req.params.id,
  );
  return ApiResponse.success(
    res,
    prescription,
    "Prescription retrieved successfully",
  );
});

export const createPrescription = asyncHandler(async (req, res) => {
  const prescription = await prescriptionService.createPrescription(
    req.body,
    req.user.id,
  );
  emitPrescriptionCreated(prescription);
  return ApiResponse.created(
    res,
    prescription,
    "Prescription created successfully",
  );
});

export const dispenseMedicine = asyncHandler(async (req, res) => {
  const quantity = req.body.quantity;
  const result = await prescriptionService.dispenseMedicine(
    req.params.id,
    quantity,
    req.user.id,
  );
  emitMedicineDispensed(result);
  return ApiResponse.success(res, result, "Medicine dispensed successfully");
});

export const stopPrescription = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const prescription = await prescriptionService.stopPrescription(
    req.params.id,
    reason,
    req.user.id,
  );
  return ApiResponse.success(
    res,
    prescription,
    "Prescription stopped successfully",
  );
});
