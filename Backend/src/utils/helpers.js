import crypto from "crypto";

/**
 * Generate unique patient ID
 * Format: P-YYYYMMDD-XXXX
 */
export const generatePatientId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();

  return `P-${year}${month}${day}-${random}`;
};

/**
 * Generate unique card number
 * Format: C-XXXXXXXXXX
 */
export const generateCardNumber = () => {
  const random = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `C-${random}`;
};

/**
 * Generate unique visit number
 * Format: V-YYYYMMDD-XXXX
 */
export const generateVisitNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();

  return `V-${year}${month}${day}-${random}`;
};

/**
 * Generate unique medicine ID
 * Format: M-XXXXXX
 */
export const generateMedicineId = () => {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `M-${random}`;
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

/**
 * Calculate BMI (Body Mass Index)
 */
export const calculateBMI = (weight, height) => {
  if (!weight || !height) return null;

  // Weight in kg, height in cm
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);

  return Math.round(bmi * 10) / 10;
};

/**
 * Sanitize filename for uploads
 */
export const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  return cleaned;
};

/**
 * Pagination helper
 */
export const getPagination = (page = 1, pageSize = 10) => {
  const limit = pageSize > 100 ? 100 : pageSize;
  const offset = (page - 1) * limit;

  return { limit, offset };
};

/**
 * Check if date is expired
 */
export const isExpired = (expiryDate) => {
  const today = new Date();
  const expiry = new Date(expiryDate);

  return today > expiry;
};

/**
 * Generate random OTP
 */
export const generateOTP = (length = 6) => {
  return crypto
    .randomInt(Math.pow(10, length - 1), Math.pow(10, length))
    .toString();
};

/**
 * Hash string (for tokens)
 */
export const hashString = (str) => {
  return crypto.createHash("sha256").update(str).digest("hex");
};

/**
 * Sleep function for delays
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Remove sensitive fields from object
 */
export const excludeFields = (obj, fields = []) => {
  const newObj = { ...obj };
  fields.forEach((field) => {
    delete newObj[field];
  });
  return newObj;
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
  if (!date) return null;

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Format time to HH:MM:SS
 */
export const formatTime = (date) => {
  if (!date) return null;

  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};
