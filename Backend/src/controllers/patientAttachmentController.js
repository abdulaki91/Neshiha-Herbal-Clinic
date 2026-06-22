import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as patientAttachmentService from "../services/patientAttachmentService.js";

/**
 * @route   POST /api/v1/patients/:id/attachments
 * @desc    Upload new attachment to a patient record
 * @access  Private (Doctor, Data Clerk, Admin)
 */
export const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.badRequest(res, "Please upload a file");
  }

  const { visitId } = req.body;
  const attachment = await patientAttachmentService.createAttachment({
    patientId: req.params.id,
    visitId,
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
 * @route   GET /api/v1/patients/:id/attachments
 * @desc    Get all attachments for a patient
 * @access  Private
 */
export const getAttachments = asyncHandler(async (req, res) => {
  const attachments = await patientAttachmentService.getAttachmentsByPatientId(
    req.params.id,
  );

  return ApiResponse.success(
    res,
    attachments,
    "Attachments retrieved successfully",
  );
});

/**
 * @route   DELETE /api/v1/patients/:id/attachments/:attachmentId
 * @desc    Delete a patient attachment
 * @access  Private (Doctor, Admin)
 */
export const deleteAttachment = asyncHandler(async (req, res) => {
  const result = await patientAttachmentService.deleteAttachment(
    req.params.attachmentId,
  );

  return ApiResponse.success(res, null, result.message);
});
