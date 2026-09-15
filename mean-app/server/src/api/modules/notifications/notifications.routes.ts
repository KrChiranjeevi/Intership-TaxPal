// src/api/modules/notifications/notifications.routes.ts
import { Router } from "express";
import * as notificationsController from "./notifications.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// Protect all routes
router.use(authMiddleware);

// User Notifications REST APIs
router.get("/", notificationsController.getNotifications);
router.patch("/read-all", notificationsController.markAllAsRead);
router.patch("/:id/read", notificationsController.markAsRead);
router.delete("/:id", notificationsController.deleteNotification);

// User notification preferences
router.get("/settings", notificationsController.getNotificationSettings);
router.put("/settings", notificationsController.updateNotificationSettings);
router.post("/test-email", notificationsController.sendTestEmail);

export default router;
