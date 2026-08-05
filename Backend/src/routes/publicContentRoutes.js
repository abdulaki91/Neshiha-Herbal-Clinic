import express from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ApiResponse } from "../utils/response.js";
import testimonialService from "../services/testimonialService.js";
import successStoryService from "../services/successStoryService.js";
import faqService from "../services/faqService.js";
import teamMemberService from "../services/teamMemberService.js";
import partnerService from "../services/partnerService.js";
import bannerService from "../services/bannerService.js";
import serviceService from "../services/serviceService.js";
import * as settingService from "../services/settingService.js";

// This entire file is the unauthenticated public surface of the API — the
// only routes in the whole backend with no `authenticate` in front of them.
// Nothing here may ever mutate data or return anything beyond what's safe
// to show an anonymous website visitor (see settingService.getPublicSiteInfo
// for the explicit field whitelist that enforces that for business/contact
// info specifically).
const router = express.Router();

const publishedRoute = (path, service) =>
  router.get(
    path,
    asyncHandler(async (req, res) => {
      const items = await service.getPublished();
      return ApiResponse.success(res, items, "Retrieved successfully");
    }),
  );

publishedRoute("/testimonials", testimonialService);
publishedRoute("/success-stories", successStoryService);
publishedRoute("/faqs", faqService);
publishedRoute("/team-members", teamMemberService);
publishedRoute("/partners", partnerService);
publishedRoute("/services", serviceService);

router.get(
  "/banners",
  asyncHandler(async (req, res) => {
    const items = await bannerService.getPublished();
    const now = new Date();
    // Only banners currently within their optional start/end window
    const active = items.filter((b) => {
      if (b.startDate && new Date(b.startDate) > now) return false;
      if (b.endDate && new Date(b.endDate) < now) return false;
      return true;
    });
    return ApiResponse.success(res, active, "Retrieved successfully");
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
