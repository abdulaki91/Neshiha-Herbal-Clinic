import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * Builds the standard set of asyncHandler-wrapped controller functions for
 * a content-collection service (see contentCollectionFactory.js). Kept
 * generic on purpose — resource-specific behavior (image field mapping,
 * validation) lives in each resource's own route/validator file.
 */
export const createCollectionController = (service, resourceName) => ({
  getAll: asyncHandler(async (req, res) => {
    const result = await service.getAll(req.query);
    return ApiResponse.paginated(
      res,
      result.rows,
      result.pagination,
      `${resourceName} retrieved successfully`,
    );
  }),

  getById: asyncHandler(async (req, res) => {
    const item = await service.getById(req.params.id);
    return ApiResponse.success(res, item, `${resourceName} retrieved successfully`);
  }),

  getPublished: asyncHandler(async (req, res) => {
    const items = await service.getPublished();
    return ApiResponse.success(res, items, `${resourceName} retrieved successfully`);
  }),

  create: asyncHandler(async (req, res) => {
    const item = await service.create(req.body, req.user);
    return ApiResponse.created(res, item, `${resourceName} created successfully`);
  }),

  update: asyncHandler(async (req, res) => {
    const item = await service.update(req.params.id, req.body, req.user);
    return ApiResponse.success(res, item, `${resourceName} updated successfully`);
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await service.remove(req.params.id);
    return ApiResponse.success(res, null, result.message);
  }),

  setStatus: asyncHandler(async (req, res) => {
    const item = await service.setStatus(req.params.id, req.body.status, req.user);
    return ApiResponse.success(
      res,
      item,
      `${resourceName} status updated successfully`,
    );
  }),

  reorder: asyncHandler(async (req, res) => {
    const item = await service.reorder(req.params.id, req.body.direction, req.user);
    return ApiResponse.success(res, item, `${resourceName} reordered successfully`);
  }),
});
