import { body } from "express-validator";
import { translatableField, requiredTranslatableField } from "./contentCollectionValidators.js";

export {
  setStatusValidator,
  reorderValidator,
  collectionQueryValidator,
} from "./contentCollectionValidators.js";

export const createFaqValidator = [
  requiredTranslatableField(body("question")),
  requiredTranslatableField(body("answer")),
  body("category").optional().trim(),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];

export const updateFaqValidator = [
  translatableField(body("question")),
  translatableField(body("answer")),
  body("category").optional().trim(),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];
