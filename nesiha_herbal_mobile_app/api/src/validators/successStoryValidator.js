import { body } from "express-validator";
import { translatableField, requiredTranslatableField } from "./contentCollectionValidators.js";

export {
  setStatusValidator,
  reorderValidator,
  collectionQueryValidator,
} from "./contentCollectionValidators.js";

export const createSuccessStoryValidator = [
  requiredTranslatableField(body("title")),
  translatableField(body("description")),
  translatableField(body("projectDetails")),
  translatableField(body("outcomes")),
  body("category").optional().trim(),
  body("featured").optional().isBoolean(),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];

export const updateSuccessStoryValidator = [
  translatableField(body("title")),
  translatableField(body("description")),
  translatableField(body("projectDetails")),
  translatableField(body("outcomes")),
  body("category").optional().trim(),
  body("featured").optional().isBoolean(),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];
