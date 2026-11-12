import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as reportService from "../services/reportService.js";

export const getPatientReport = asyncHandler(async (req, res) => {
  const report = await reportService.getPatientReport(req.query);
  return ApiResponse.success(
    res,
    report,
    "Patient report generated successfully",
  );
});

export const getVisitReport = asyncHandler(async (req, res) => {
  const report = await reportService.getVisitReport(req.query);
  return ApiResponse.success(
    res,
    report,
    "Visit report generated successfully",
  );
});

export const getMedicineReport = asyncHandler(async (req, res) => {
  const report = await reportService.getMedicineReport(req.query);
  return ApiResponse.success(
    res,
    report,
    "Medicine report generated successfully",
  );
});

export const getDailyReport = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const report = await reportService.getDailyReport(date);
  return ApiResponse.success(
    res,
    report,
    "Daily report generated successfully",
  );
});

export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const report = await reportService.getMonthlyReport(year, month);
  return ApiResponse.success(
    res,
    report,
    "Monthly report generated successfully",
  );
});

export const getYearlyReport = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const report = await reportService.getYearlyReport(year);
  return ApiResponse.success(
    res,
    report,
    "Yearly report generated successfully",
  );
});

export const getRevenueReport = asyncHandler(async (req, res) => {
  const { period, date } = req.query;
  const report = await reportService.getRevenueReport(period, date);
  return ApiResponse.success(
    res,
    report,
    "Revenue report generated successfully",
  );
});
