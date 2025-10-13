// src/api/modules/notifications/notifications.routes.ts
import { Router } from "express";
import * as notificationsController from "./notifications.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// Protect all routes
router.use(authMiddleware);

// Get user notification preferences
router.get("/", notificationsController.getNotificationSettings);

// Update user notification preferences
router.put("/", notificationsController.updateNotificationSettings);

export default router;
