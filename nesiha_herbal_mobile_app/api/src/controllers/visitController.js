import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as visitService from "../services/visitService.js";
import * as patientAttachmentService from "../services/patientAttachmentService.js";
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

export const getAppointments = asyncHandler(async (req, res) => {
  const result = await visitService.getAppointments(req.query);
  return ApiResponse.paginated(
    res,
    result.appointments,
    result.pagination,
    "Appointments retrieved successfully",
  );
});

export const checkInAppointment = asyncHandler(async (req, res) => {
  const visit = await visitService.checkInAppointment(
    req.params.id,
    req.user.id,
  );
  emitVisitStatusChanged(visit);
  return ApiResponse.success(res, visit, "Patient checked in successfully");
});

export const assignDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.body;
  const visit = await visitService.assignDoctor(
    req.params.id,
    doctorId,
    req.user.id,
  );
  emitVisitStatusChanged(visit);
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

/**
 * @route   POST /api/v1/visits/:id/attachments
 * @desc    Upload single attachment during consultation
 * @access  Private (Doctor, Data Clerk)
 */
export const uploadVisitAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.badRequest(res, "Please upload a file");
  }

  // Get visit and extract patient ID
  const visit = await visitService.getVisitById(req.params.id);

  const attachment = await patientAttachmentService.createAttachment({
    patientId: visit.patient.id,
    visitId: req.params.id,
    file: req.file,
    userId: req.user.id,
  });

  return ApiResponse.created(
    res,
    attachment,
    "Attachment uploaded successfully",
  );
});

/**
 * @route   POST /api/v1/visits/:id/attachments/multiple
 * @desc    Upload multiple attachments during consultation
 * @access  Private (Doctor, Data Clerk)
 */
export const uploadMultipleVisitAttachments = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return ApiResponse.badRequest(res, "Please upload at least one file");
  }

  // Get visit and extract patient ID
  const visit = await visitService.getVisitById(req.params.id);

  const attachments = await Promise.all(
    req.files.map((file) =>
      patientAttachmentService.createAttachment({
        patientId: visit.patient.id,
        visitId: req.params.id,
        file,
        userId: req.user.id,
      }),
    ),
  );

  return ApiResponse.created(
    res,
    attachments,
    `${attachments.length} attachment(s) uploaded successfully`,
  );
});

/**
 * @route   GET /api/v1/visits/:id/attachments
 * @desc    Get all attachments for a specific visit
 * @access  Private
 */
export const getVisitAttachments = asyncHandler(async (req, res) => {
  const attachments = await patientAttachmentService.getAttachmentsByVisitId(
    req.params.id,
  );

  return ApiResponse.success(
    res,
    attachments,
    "Visit attachments retrieved successfully",
  );
});

/**
 * @route   GET /api/v1/visits/completed
 * @desc    Get all completed consultations for the logged-in doctor
 * @access  Private (Doctor)
 */
export const getCompletedConsultations = asyncHandler(async (req, res) => {
  const result = await visitService.getCompletedConsultations(
    req.user.id,
    req.query,
  );

  return ApiResponse.paginated(
    res,
    result.consultations,
    result.pagination,
    "Completed consultations retrieved successfully",
  );
});
