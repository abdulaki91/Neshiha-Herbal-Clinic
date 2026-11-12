import express from "express";
import * as notificationController from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

// Mobile push: register / remove this phone's Firebase token (before /:id).
router.post("/devices", notificationController.registerDevice);
router.delete("/devices", notificationController.unregisterDevice);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);
router.delete("/", notificationController.deleteAllNotifications);

export default router;
