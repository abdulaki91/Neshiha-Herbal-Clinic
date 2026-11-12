import { body } from "express-validator";

// Translatable fields are stored as { en, am, om, ar } — only require that
// the object is present and, if it declares an English value, that it's a
// string; every locale key is otherwise optional.
const translatableField = (chain) =>
  chain
    .optional()
    .custom((value) => typeof value === "object" && value !== null && !Array.isArray(value))
    .withMessage("Must be a { en, am, om, ar } object");

const urlField = (chain) =>
  chain
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: true })
    .withMessage("Must be a valid URL");

export const updateSettingsValidator = [
  body("clinicName").optional().trim(),
  body("clinicPhone").optional().trim(),
  body("clinicEmail").optional().isEmail().withMessage("Invalid email"),
  body("lowStockThreshold")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Invalid threshold"),
  body("enableEmailNotifications").optional().isBoolean(),
  body("enableSMSNotifications").optional().isBoolean(),
  // Business Information
  translatableField(body("tagline")),
  translatableField(body("mission")),
  translatableField(body("vision")),
  translatableField(body("aboutText")),
  // { nullable: true } matters here: the form sends null (not undefined)
  // for a blank number field, and express-validator's optional() only
  // skips undefined by default — without this, clearing the field to
  // empty fails validation instead of clearing it.
  body("yearsExperience").optional({ nullable: true }).isInt({ min: 0 }).withMessage("Invalid value"),
  body("patientsServed").optional({ nullable: true }).isInt({ min: 0 }).withMessage("Invalid value"),
  body("treatmentsOffered").optional({ nullable: true }).isInt({ min: 0 }).withMessage("Invalid value"),
  // Contact Information
  body("whatsappNumber").optional().trim(),
  urlField(body("facebookUrl")),
  urlField(body("instagramUrl")),
  urlField(body("tiktokUrl")),
  urlField(body("twitterUrl")),
  body("googleMapsEmbedUrl").optional().trim(),
];
