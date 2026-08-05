import express from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ApiResponse } from "../utils/response.js";
import testimonialService from "../services/testimonialService.js";
import * as settingService from "../services/settingService.js";

// This entire file is the unauthenticated public surface of the API — the
// only routes in the whole backend with no `authenticate` in front of them.
// Nothing here may ever mutate data or return anything beyond what's safe
// to show an anonymous website visitor (see settingService.getPublicSiteInfo
// for the explicit field whitelist that enforces that for business/contact
// info specifically).
const router = express.Router();

router.get(
  "/testimonials",
  asyncHandler(async (req, res) => {
    const items = await testimonialService.getPublished();
    return ApiResponse.success(res, items, "Testimonials retrieved successfully");
  }),
);

router.get(
  "/site-info",
  asyncHandler(async (req, res) => {
    const info = await settingService.getPublicSiteInfo();
    return ApiResponse.success(res, info, "Site info retrieved successfully");
  }),
);

export default router;
