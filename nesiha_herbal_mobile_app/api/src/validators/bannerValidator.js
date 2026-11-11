import { body } from "express-validator";
import { translatableField, requiredTranslatableField } from "./contentCollectionValidators.js";

export {
  setStatusValidator,
  reorderValidator,
  collectionQueryValidator,
} from "./contentCollectionValidators.js";

export const createBannerValidator = [
  requiredTranslatableField(body("title")),
  translatableField(body("subtitle")),
  translatableField(body("ctaText")),
  body("ctaLink").optional().trim(),
  // { nullable: true }: the form sends null for a cleared date input, and
  // optional() alone only skips undefined, not null.
  body("startDate").optional({ nullable: true }).isISO8601().withMessage("Invalid date"),
  body("endDate").optional({ nullable: true }).isISO8601().withMessage("Invalid date"),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];

export const updateBannerValidator = [
  translatableField(body("title")),
  translatableField(body("subtitle")),
  translatableField(body("ctaText")),
  body("ctaLink").optional().trim(),
  // { nullable: true }: the form sends null for a cleared date input, and
  // optional() alone only skips undefined, not null.
  body("startDate").optional({ nullable: true }).isISO8601().withMessage("Invalid date"),
  body("endDate").optional({ nullable: true }).isISO8601().withMessage("Invalid date"),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
];
