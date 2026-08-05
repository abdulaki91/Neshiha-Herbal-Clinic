import { body } from "express-validator";
import { translatableField } from "./contentCollectionValidators.js";

export {
  setStatusValidator,
  reorderValidator,
  collectionQueryValidator,
} from "./contentCollectionValidators.js";

export const createTeamMemberValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  translatableField(body("role")),
  translatableField(body("bio")),
  body("socialLinks")
    .optional()
    .custom((value) => typeof value === "object" && value !== null && !Array.isArray(value))
    .withMessage("Must be an object"),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];

export const updateTeamMemberValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  translatableField(body("role")),
  translatableField(body("bio")),
  body("socialLinks")
    .optional()
    .custom((value) => typeof value === "object" && value !== null && !Array.isArray(value))
    .withMessage("Must be an object"),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];
