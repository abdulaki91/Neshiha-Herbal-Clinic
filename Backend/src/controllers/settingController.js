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

export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) return ApiResponse.badRequest(res, "Please upload a file");

  const settings = await settingService.updateSettings(
    { clinicLogo: `uploads/content/${req.file.filename}` },
    req.user.id,
  );

  return ApiResponse.success(res, settings, "Logo uploaded successfully");
});

export const getPublicSiteInfo = asyncHandler(async (req, res) => {
  const info = await settingService.getPublicSiteInfo();
  return ApiResponse.success(res, info, "Site info retrieved successfully");
});
