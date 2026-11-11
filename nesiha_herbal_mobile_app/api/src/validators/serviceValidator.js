import { body } from "express-validator";
import { translatableField, requiredTranslatableField } from "./contentCollectionValidators.js";

export {
  setStatusValidator,
  reorderValidator,
  collectionQueryValidator,
} from "./contentCollectionValidators.js";

export const createServiceValidator = [
  body("icon").optional().trim(),
  requiredTranslatableField(body("title")),
  translatableField(body("description")),
  translatableField(body("features")),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];

export const updateServiceValidator = [
  body("icon").optional().trim(),
  translatableField(body("title")),
  translatableField(body("description")),
  translatableField(body("features")),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];
