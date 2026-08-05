import express from "express";
import teamMemberController from "../controllers/teamMemberController.js";
import * as teamMemberValidator from "../validators/teamMemberValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogger, auditUpdate } from "../middleware/audit.js";
import { uploadSingle, attachImagePath, parseJsonFields } from "../middleware/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

router.get(
  "/",
  teamMemberValidator.collectionQueryValidator,
  validate,
  teamMemberController.getAll,
);

router.get("/:id", teamMemberController.getById);

router.post(
  "/",
  uploadSingle("image"),
  attachImagePath("photo"),
  parseJsonFields("role", "bio", "socialLinks"),
  teamMemberValidator.createTeamMemberValidator,
  validate,
  auditLogger("CREATE", "TeamMember"),
  teamMemberController.create,
);

router.put(
  "/:id",
  uploadSingle("image"),
  attachImagePath("photo"),
  parseJsonFields("role", "bio", "socialLinks"),
  teamMemberValidator.updateTeamMemberValidator,
  validate,
  auditUpdate("TeamMember"),
  teamMemberController.update,
);

router.delete(
  "/:id",
  auditLogger("DELETE", "TeamMember"),
  teamMemberController.remove,
);

router.patch(
  "/:id/status",
  teamMemberValidator.setStatusValidator,
  validate,
  auditLogger("UPDATE", "TeamMember"),
  teamMemberController.setStatus,
);

router.patch(
  "/:id/reorder",
  teamMemberValidator.reorderValidator,
  validate,
  teamMemberController.reorder,
);

export default router;
