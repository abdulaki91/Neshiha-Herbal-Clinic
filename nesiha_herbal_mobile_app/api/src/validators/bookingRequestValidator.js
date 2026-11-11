import { body, query } from "express-validator";

export const createBookingRequestValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
  body("preferredDate")
    .notEmpty()
    .withMessage("Preferred date is required")
    .isISO8601()
    .withMessage("Invalid date")
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(value) < today) throw new Error("Preferred date cannot be in the past");
      return true;
    }),
  body("preferredTime").optional().trim(),
  body("reason").optional().trim(),
];

export const updateStatusValidator = [
  body("status")
    .optional()
    .isIn(["pending", "contacted", "confirmed", "declined", "converted"])
    .withMessage("Invalid status"),
  body("staffNotes").optional({ nullable: true }).trim(),
  body("convertedVisitId").optional({ nullable: true }).isUUID().withMessage("Invalid visit id"),
];

export const bookingQueryValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).withMessage("Page size must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["pending", "contacted", "confirmed", "declined", "converted"])
    .withMessage("Invalid status"),
];
