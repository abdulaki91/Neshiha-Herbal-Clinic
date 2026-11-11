import { body, query } from "express-validator";

// Translatable fields are stored as { en, am, om, ar } JSON objects.
export const translatableField = (chain) =>
  chain
    .optional()
    .custom((value) => typeof value === "object" && value !== null && !Array.isArray(value))
    .withMessage("Must be a { en, am, om, ar } object");

export const requiredTranslatableField = (chain) =>
  chain
    .custom(
      (value) =>
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        typeof value.en === "string" &&
        value.en.trim().length > 0,
    )
    .withMessage("An English value is required");

export const urlField = (chain) =>
  chain
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: true })
    .withMessage("Must be a valid URL");

// Shared across every content-collection route file — identical for all 7
// resources, so defined once here instead of copy-pasted seven times.
export const setStatusValidator = [
  body("status").isIn(["draft", "published"]).withMessage("Invalid status"),
];

export const reorderValidator = [
  body("direction").isIn(["up", "down"]).withMessage("Direction must be 'up' or 'down'"),
];

export const collectionQueryValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Page size must be between 1 and 100"),
  query("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];
