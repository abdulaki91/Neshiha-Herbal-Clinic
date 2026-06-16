import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as investigationService from "../services/investigationService.js";

export const getAllInvestigations = asyncHandler(async (req, res) => {
  const result = await investigationService.getAllInvestigations(req.query);
  return ApiResponse.paginated(
    res,
    result.investigations,
    result.pagination,
    "Investigations retrieved successfully",
  );
});

export const getInvestigationById = asyncHandler(async (req, res) => {
  const investigation = await investigationService.getInvestigationById(
    req.params.id,
  );
  return ApiResponse.success(
    res,
    investigation,
    "Investigation retrieved successfully",
  );
});

export const createInvestigation = asyncHandler(async (req, res) => {
  const investigation = await investigationService.createInvestigation(
    req.body,
    req.user.id,
  );
  return ApiResponse.created(
    res,
    investigation,
    "Investigation created successfully",
  );
});

export const updateInvestigation = asyncHandler(async (req, res) => {
  const investigation = await investigationService.updateInvestigation(
    req.params.id,
    req.body,
    req.user.id,
  );
  return ApiResponse.success(
    res,
    investigation,
    "Investigation updated successfully",
  );
});

export const addResults = asyncHandler(async (req, res) => {
  const { results } = req.body;
  const resultFile = req.file ? req.file.path : null;
  const investigation = await investigationService.addResults(
    req.params.id,
    results,
    resultFile,
    req.user.id,
  );
  return ApiResponse.success(
    res,
    investigation,
    "Investigation results added successfully",
  );
});
