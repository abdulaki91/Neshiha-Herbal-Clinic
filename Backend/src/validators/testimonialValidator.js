import { body } from "express-validator";
import { translatableField, requiredTranslatableField } from "./contentCollectionValidators.js";

export {
  setStatusValidator,
  reorderValidator,
  collectionQueryValidator,
} from "./contentCollectionValidators.js";

export const createTestimonialValidator = [
  body("clientName").trim().notEmpty().withMessage("Client name is required"),
  body("company").optional().trim(),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  requiredTranslatableField(body("text")),
  translatableField(body("role")),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];

export const updateTestimonialValidator = [
  body("clientName").optional().trim().notEmpty().withMessage("Client name cannot be empty"),
  body("company").optional().trim(),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  translatableField(body("text")),
  translatableField(body("role")),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];
