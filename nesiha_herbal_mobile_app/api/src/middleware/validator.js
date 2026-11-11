import { validationResult } from "express-validator";
import { ApiResponse } from "../utils/response.js";

/**
 * Validate request using express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return ApiResponse.badRequest(res, "Validation failed", extractedErrors);
  }

  next();
};
