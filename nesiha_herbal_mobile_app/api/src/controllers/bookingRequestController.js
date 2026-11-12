import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as bookingRequestService from "../services/bookingRequestService.js";
import { emitBookingRequestCreated } from "../config/socket.js";

export const create = asyncHandler(async (req, res) => {
  const booking = await bookingRequestService.create(req.body);
  emitBookingRequestCreated(booking);
  return ApiResponse.created(res, booking, "Booking request submitted successfully");
});

export const getAll = asyncHandler(async (req, res) => {
  const result = await bookingRequestService.getAll(req.query);
  return ApiResponse.paginated(res, result.rows, result.pagination, "Booking requests retrieved successfully");
});

export const getById = asyncHandler(async (req, res) => {
  const booking = await bookingRequestService.getById(req.params.id);
  return ApiResponse.success(res, booking, "Booking request retrieved successfully");
});

export const getPendingCount = asyncHandler(async (req, res) => {
  const count = await bookingRequestService.getPendingCount();
  return ApiResponse.success(res, { count }, "Pending count retrieved successfully");
});

export const updateStatus = asyncHandler(async (req, res) => {
  const booking = await bookingRequestService.updateStatus(req.params.id, req.body, req.user);
  return ApiResponse.success(res, booking, "Booking request updated successfully");
});
