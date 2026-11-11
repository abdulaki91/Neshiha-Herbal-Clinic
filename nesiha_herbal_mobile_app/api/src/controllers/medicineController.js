import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as medicineService from "../services/medicineService.js";

export const getAllMedicines = asyncHandler(async (req, res) => {
  const result = await medicineService.getAllMedicines(req.query);
  return ApiResponse.paginated(
    res,
    result.medicines,
    result.pagination,
    "Medicines retrieved successfully",
  );
});

export const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await medicineService.getMedicineById(req.params.id);
  return ApiResponse.success(res, medicine, "Medicine retrieved successfully");
});

export const createMedicine = asyncHandler(async (req, res) => {
  const medicine = await medicineService.createMedicine(req.body, req.user.id);
  return ApiResponse.created(res, medicine, "Medicine created successfully");
});

export const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await medicineService.updateMedicine(
    req.params.id,
    req.body,
    req.user.id,
  );
  return ApiResponse.success(res, medicine, "Medicine updated successfully");
});

export const deleteMedicine = asyncHandler(async (req, res) => {
  const result = await medicineService.deleteMedicine(req.params.id);
  return ApiResponse.success(res, null, result.message);
});

export const adjustStock = asyncHandler(async (req, res) => {
  const { quantity, type } = req.body;
  const medicine = await medicineService.adjustStock(
    req.params.id,
    quantity,
    type,
    req.user.id,
  );
  return ApiResponse.success(res, medicine, "Stock adjusted successfully");
});

export const getLowStockMedicines = asyncHandler(async (req, res) => {
  const medicines = await medicineService.getLowStockMedicines();
  return ApiResponse.success(
    res,
    medicines,
    "Low stock medicines retrieved successfully",
  );
});

export const getExpiredMedicines = asyncHandler(async (req, res) => {
  const medicines = await medicineService.getExpiredMedicines();
  return ApiResponse.success(
    res,
    medicines,
    "Expired medicines retrieved successfully",
  );
});

export const getMedicineStats = asyncHandler(async (req, res) => {
  const stats = await medicineService.getMedicineStats();
  return ApiResponse.success(
    res,
    stats,
    "Medicine statistics retrieved successfully",
  );
});
