import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as dashboardService from "../services/dashboardService.js";

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.getAdminDashboard();
  return ApiResponse.success(
    res,
    dashboard,
    "Admin dashboard retrieved successfully",
  );
});

export const getDoctorDashboard = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.getDoctorDashboard(req.user.id);
  return ApiResponse.success(
    res,
    dashboard,
    "Doctor dashboard retrieved successfully",
  );
});

export const getClerkDashboard = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.getClerkDashboard();
  return ApiResponse.success(
    res,
    dashboard,
    "Data clerk dashboard retrieved successfully",
  );
});
