import { Op } from "sequelize";
import { getPagination } from "../utils/helpers.js";

// errorHandler reads err.statusCode, otherwise everything surfaces as a 500
const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Builds the standard CRUD + publish/reorder service shared by every
 * "content collection" table (Testimonial, SuccessStory, Faq, TeamMember,
 * Partner, Banner, Service). They're identical in shape — paginated admin
 * listing with search, get-by-id, create/update/delete, step reordering,
 * a draft/published status toggle, and a published-only getter for the
 * public site — so this is written once instead of seven times.
 */
export const createCollectionService = (
  Model,
  { searchableFields = [] } = {},
) => ({
  async getAll(query) {
    const {
      page = 1,
      pageSize = 10,
      status,
      search,
      sortBy = "sortOrder",
      sortOrder = "ASC",
    } = query;

    const { limit, offset } = getPagination(page, pageSize);
    const where = {};

    if (status) where.status = status;

    if (search && searchableFields.length > 0) {
      where[Op.or] = searchableFields.map((field) => ({
        [field]: { [Op.like]: `%${search}%` },
      }));
    }

    const { count, rows } = await Model.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      rows,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        totalItems: count,
      },
    };
  },

  async getById(id) {
    const item = await Model.findByPk(id);
    if (!item) throw httpError("Not found", 404);
    return item;
  },

  // Public-site read: only ever published items, no pagination envelope.
  async getPublished() {
    return Model.findAll({
      where: { status: "published" },
      order: [["sortOrder", "ASC"]],
    });
  },

  async create(data, actor) {
    const maxOrder = await Model.max("sortOrder");
    return Model.create({
      ...data,
      sortOrder: Number.isFinite(maxOrder) ? maxOrder + 1 : 0,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
  },

  async update(id, data, actor) {
    const item = await Model.findByPk(id);
    if (!item) throw httpError("Not found", 404);
    await item.update({ ...data, updatedBy: actor?.id });
    return item;
  },

  async remove(id) {
    const item = await Model.findByPk(id);
    if (!item) throw httpError("Not found", 404);
    await item.destroy();
    return { message: "Deleted successfully" };
  },

  async setStatus(id, status, actor) {
    const item = await Model.findByPk(id);
    if (!item) throw httpError("Not found", 404);
    await item.update({ status, updatedBy: actor?.id });
    return item;
  },

  // Swap sortOrder with the immediate neighbor in that direction — a
  // simple, dependency-free way to support up/down reordering in the UI.
  async reorder(id, direction, actor) {
    const item = await Model.findByPk(id);
    if (!item) throw httpError("Not found", 404);

    const neighbor = await Model.findOne({
      where: {
        sortOrder:
          direction === "up"
            ? { [Op.lt]: item.sortOrder }
            : { [Op.gt]: item.sortOrder },
      },
      order: [["sortOrder", direction === "up" ? "DESC" : "ASC"]],
    });

    if (!neighbor) return item; // already at the boundary

    const itemOrder = item.sortOrder;
    const neighborOrder = neighbor.sortOrder;

    await item.update({ sortOrder: neighborOrder, updatedBy: actor?.id });
    await neighbor.update({ sortOrder: itemOrder, updatedBy: actor?.id });

    return item;
  },
});
