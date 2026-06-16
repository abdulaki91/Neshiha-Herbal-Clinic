import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as staffService from "../services/staffService.js";

/**
 * @route   GET /api/v1/staff
 * @desc    Get all staff
 * @access  Private (Super Admin, Staff Manager)
 */
export const getAllStaff = asyncHandler(async (req, res) => {
  const result = await staffService.getAllStaff(req.query);

  return ApiResponse.paginated(
    res,
    result.staff,
    result.pagination,
    "Staff retrieved successfully",
  );
});

/**
 * @route   GET /api/v1/staff/:id
 * @desc    Get staff by ID
 * @access  Private
 */
export const getStaffById = asyncHandler(async (req, res) => {
  const staff = await staffService.getStaffById(req.params.id);

  return ApiResponse.success(res, staff, "Staff retrieved successfully");
});

/**
 * @route   POST /api/v1/staff
 * @desc    Create new staff
 * @access  Private (Super Admin, Staff Manager)
 */
export const createStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.createStaff(req.body, req.user.id);

  return ApiResponse.created(res, staff, "Staff created successfully");
});

/**
 * @route   PUT /api/v1/staff/:id
 * @desc    Update staff
 * @access  Private (Super Admin, Staff Manager)
 */
export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.updateStaff(
    req.params.id,
    req.body,
    req.user.id,
  );

  return ApiResponse.success(res, staff, "Staff updated successfully");
});

/**
 * @route   DELETE /api/v1/staff/:id
 * @desc    Delete staff
 * @access  Private (Super Admin)
 */
export const deleteStaff = asyncHandler(async (req, res) => {
  const result = await staffService.deleteStaff(req.params.id);

  return ApiResponse.success(res, null, result.message);
});

/**
 * @route   PATCH /api/v1/staff/:id/activate
 * @desc    Activate staff
 * @access  Private (Super Admin, Staff Manager)
 */
export const activateStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.activateStaff(req.params.id);

  return ApiResponse.success(res, staff, "Staff activated successfully");
});

/**
 * @route   PATCH /api/v1/staff/:id/deactivate
 * @desc    Deactivate staff
 * @access  Private (Super Admin, Staff Manager)
 */
export const deactivateStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.deactivateStaff(req.params.id);

  return ApiResponse.success(res, staff, "Staff deactivated successfully");
});

/**
 * @route   GET /api/v1/staff/stats
 * @desc    Get staff statistics
 * @access  Private (Super Admin, Staff Manager)
 */
export const getStaffStats = asyncHandler(async (req, res) => {
  const stats = await staffService.getStaffStats();

  return ApiResponse.success(
    res,
    stats,
    "Staff statistics retrieved successfully",
  );
});
