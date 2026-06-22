import { PatientAttachment, Patient } from "../models/index.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");

/**
 * Add attachment to a patient record
 */
export const createAttachment = async ({ patientId, visitId, file, userId }) => {
  const patient = await Patient.findByPk(patientId);
  if (!patient) {
    throw new Error("Patient not found");
  }

  // Convert absolute path to relative web-friendly path (e.g. uploads/documents/filename.ext)
  const relativePath = file.path.replace(/\\/g, "/").split("/uploads/").pop().split("uploads/").pop();
  const cleanPath = `uploads/${relativePath}`;

  const attachment = await PatientAttachment.create({
    patientId,
    visitId: visitId || null,
    fileName: file.originalname,
    filePath: cleanPath,
    fileType: file.mimetype,
    uploadedBy: userId,
  });

  return attachment;
};

/**
 * Get all attachments for a patient
 */
export const getAttachmentsByPatientId = async (patientId) => {
  const patient = await Patient.findByPk(patientId);
  if (!patient) {
    throw new Error("Patient not found");
  }

  const attachments = await PatientAttachment.findAll({
    where: { patientId },
    order: [["createdAt", "DESC"]],
  });

  return attachments;
};

/**
 * Delete an attachment entry and its physical file
 */
export const deleteAttachment = async (attachmentId) => {
  const attachment = await PatientAttachment.findByPk(attachmentId);
  if (!attachment) {
    throw new Error("Attachment not found");
  }

  // Extract relative path after "uploads/"
  const relativePath = attachment.filePath.replace("uploads/", "");
  const absolutePath = path.join(uploadDir, relativePath);

  // Physically delete the file if it exists
  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.error(`Failed to delete physical file at ${absolutePath}:`, error.message);
  }

  // Delete from database
  await attachment.destroy();

  return { success: true, message: "Attachment deleted successfully" };
};
