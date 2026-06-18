import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as visitService from "../services/visitService.js";
import { emitVisitCreated, emitVisitStatusChanged } from "../config/socket.js";

export const getAllVisits = asyncHandler(async (req, res) => {
  const result = await visitService.getAllVisits(req.query);
  return ApiResponse.paginated(
    res,
    result.visits,
    result.pagination,
    "Visits retrieved successfully",
  );
});

export const getVisitById = asyncHandler(async (req, res) => {
  const visit = await visitService.getVisitById(req.params.id);
  return ApiResponse.success(res, visit, "Visit retrieved successfully");
});

export const createVisit = asyncHandler(async (req, res) => {
  const visit = await visitService.createVisit(req.body, req.user.id);
  emitVisitCreated(visit);
  return ApiResponse.created(res, visit, "Visit created successfully");
});

export const updateVisit = asyncHandler(async (req, res) => {
  const visit = await visitService.updateVisit(
    req.params.id,
    req.body,
    req.user.id,
  );
  emitVisitStatusChanged(visit);
  return ApiResponse.success(res, visit, "Visit updated successfully");
});

export const updateVisitStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const visit = await visitService.updateVisitStatus(
    req.params.id,
    status,
    req.user.id,
  );
  emitVisitStatusChanged(visit);
  return ApiResponse.success(res, visit, "Visit status updated successfully");
});

export const getDoctorQueue = asyncHandler(async (req, res) => {
  const queue = await visitService.getDoctorQueue(req.user.id);
  return ApiResponse.success(res, queue, "Doctor queue retrieved successfully");
});

export const assignDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.body;
  const visit = await visitService.assignDoctor(
    req.params.id,
    doctorId,
    req.user.id,
  );
  return ApiResponse.success(res, visit, "Doctor assigned successfully");
});

export const recordVitalSigns = asyncHandler(async (req, res) => {
  const visit = await visitService.recordVitalSigns(
    req.params.id,
    req.body,
    req.user.id,
  );
  return ApiResponse.success(res, visit, "Vital signs recorded successfully");
});
