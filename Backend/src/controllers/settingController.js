import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as settingService from "../services/settingService.js";

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getSettings();
  return ApiResponse.success(res, settings, "Settings retrieved successfully");
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.updateSettings(req.body, req.user.id);
  return ApiResponse.success(res, settings, "Settings updated successfully");
});
