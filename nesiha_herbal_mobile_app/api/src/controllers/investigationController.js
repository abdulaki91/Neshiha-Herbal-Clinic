import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as investigationService from "../services/investigationService.js";
import * as notificationService from "../services/notificationService.js";
import {
  emitInvestigationCreated,
  emitInvestigationResultAdded,
} from "../config/socket.js";

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
  emitInvestigationCreated(investigation);
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

  emitInvestigationResultAdded(investigation);

  // The requesting doctor is usually away from this screen once results
  // come back (with the patient, or between consultations) — a persisted
  // notification is what actually gets their attention, not just a socket
  // event that's lost if they weren't connected at that instant
  notificationService.notifyUser(investigation.requestedBy, {
    type: "investigation_result",
    title: "Lab result ready",
    message: `${investigation.testName} results are ready for review`,
    priority: investigation.urgency === "stat" ? "urgent" : "medium",
    link: `/portal/patients/${investigation.patientId}`,
    metadata: { investigationId: investigation.id },
  });

  return ApiResponse.success(
    res,
    investigation,
    "Investigation results added successfully",
  );
});
