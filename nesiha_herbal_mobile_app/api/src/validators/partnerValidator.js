import { body } from "express-validator";
import { urlField } from "./contentCollectionValidators.js";

export {
  setStatusValidator,
  reorderValidator,
  collectionQueryValidator,
} from "./contentCollectionValidators.js";

export const createPartnerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  urlField(body("websiteUrl")),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];

export const updatePartnerValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  urlField(body("websiteUrl")),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];
