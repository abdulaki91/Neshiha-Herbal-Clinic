import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { sanitizeFilename } from "../utils/helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";

    if (file.fieldname === "photo" || file.fieldname === "profilePhoto") {
      folder = "photos";
    } else if (file.fieldname === "resultFile") {
      folder = "investigations";
    } else if (file.fieldname === "document") {
      folder = "documents";
    } else if (
      file.fieldname === "logo" ||
      file.fieldname === "image" ||
      file.fieldname === "images"
    ) {
      folder = "content";
    }

    const dest = path.join(uploadDir, folder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitized = sanitizeFilename(file.originalname);
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(",") || [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
});

// Upload single file
export const uploadSingle = (fieldName) => upload.single(fieldName);

// Upload multiple files
export const uploadMultiple = (fieldName, maxCount = 5) =>
  upload.array(fieldName, maxCount);

// Upload multiple fields
export const uploadFields = (fields) => upload.fields(fields);

// Copies multer's req.file into req.body[bodyField] as the relative path
// the rest of the app expects (e.g. "uploads/content/name-123.jpg"), so a
// generic controller can treat image fields like any other body field.
export const attachImagePath = (bodyField) => (req, res, next) => {
  if (req.file) {
    req.body[bodyField] = `uploads/content/${req.file.filename}`;
  }
  next();
};

// Same idea for a multi-file field (e.g. SuccessStory.images) — stores an
// array of relative paths.
export const attachImagePaths = (bodyField) => (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.body[bodyField] = req.files.map((f) => `uploads/content/${f.filename}`);
  }
  next();
};
