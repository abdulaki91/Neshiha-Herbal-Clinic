import * as paymentService from "../services/paymentService.js";
import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { SUCCESS_MESSAGES } from "../config/constants.js";

/**
 * Get all pending payments
 */
export const getPendingPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.getPendingPayments(req.query);
  return ApiResponse.success(res, result, "Pending payments retrieved successfully");
});

/**
 * Get payment details
 */
export const getPaymentDetails = asyncHandler(async (req, res) => {
  const visit = await paymentService.getPaymentDetails(req.params.visitId);
  return ApiResponse.success(res, visit, "Payment details retrieved successfully");
});

/**
 * Process payment
 */
export const processPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.processPayment(
    req.params.visitId,
    req.body,
    req.user.id,
  );
  return ApiResponse.created(res, payment, "Payment processed successfully");
});

/**
 * Get payment history
 */
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const result = await paymentService.getPaymentHistory(req.query);
  return ApiResponse.success(res, result, "Payment history retrieved successfully");
});
