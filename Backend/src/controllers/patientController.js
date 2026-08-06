import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as patientService from "../services/patientService.js";
import { emitPatientRegistered, emitRegistrationFeeCollected } from "../config/socket.js";

/**
 * @route   GET /api/v1/patients
 * @desc    Get all patients
 * @access  Private
 */
export const getAllPatients = asyncHandler(async (req, res) => {
  console.log("[patientController] getAllPatients query:", req.query);
  const result = await patientService.getAllPatients(req.query);
  console.log("[patientController] Result count:", result.patients?.length);

  return ApiResponse.paginated(
    res,
    result.patients,
    result.pagination,
    "Patients retrieved successfully",
  );
});

/**
 * @route   GET /api/v1/patients/:id
 * @desc    Get patient by ID
 * @access  Private
 */
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await patientService.getPatientById(req.params.id);

  return ApiResponse.success(res, patient, "Patient retrieved successfully");
});

/**
 * @route   POST /api/v1/patients
 * @desc    Create new patient
 * @access  Private (Data Clerk)
 */
export const createPatient = asyncHandler(async (req, res) => {
  const patient = await patientService.createPatient(req.body, req.user.id);
  emitPatientRegistered(patient);
  const registrationPayment = patient.getDataValue("registrationPayment");
  if (registrationPayment) {
    emitRegistrationFeeCollected(registrationPayment);
  }
  return ApiResponse.created(res, patient, "Patient registered successfully");
});

/**
 * @route   PUT /api/v1/patients/:id
 * @desc    Update patient
 * @access  Private (Data Clerk)
 */
export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await patientService.updatePatient(
    req.params.id,
    req.body,
    req.user.id,
  );

  return ApiResponse.success(res, patient, "Patient updated successfully");
});

/**
 * @route   DELETE /api/v1/patients/:id
 * @desc    Delete patient
 * @access  Private (Super Admin)
 */
export const deletePatient = asyncHandler(async (req, res) => {
  const result = await patientService.deletePatient(req.params.id);

  return ApiResponse.success(res, null, result.message);
});

/**
 * @route   GET /api/v1/patients/:id/history
 * @desc    Get patient complete history
 * @access  Private
 */
export const getPatientHistory = asyncHandler(async (req, res) => {
  const history = await patientService.getPatientHistory(req.params.id);

  return ApiResponse.success(
    res,
    history,
    "Patient history retrieved successfully",
  );
});

/**
 * @route   POST /api/v1/patients/:id/photo
 * @desc    Upload patient photo
 * @access  Private (Data Clerk)
 */
export const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.badRequest(res, "Please upload a photo");
  }

  const patient = await patientService.uploadPatientPhoto(
    req.params.id,
    req.file.path,
    req.user.id,
  );

  return ApiResponse.success(res, patient, "Photo uploaded successfully");
});

/**
 * @route   GET /api/v1/patients/stats
 * @desc    Get patient statistics
 * @access  Private
 */
export const getPatientStats = asyncHandler(async (req, res) => {
  const stats = await patientService.getPatientStats();

  return ApiResponse.success(
    res,
    stats,
    "Patient statistics retrieved successfully",
  );
});
