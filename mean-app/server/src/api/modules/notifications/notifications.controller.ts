// src/api/modules/notifications/notifications.controller.ts
import type { Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import * as notificationsService from "./notifications.service.js";

/**
 * GET /api/notifications
 * Fetch list of notifications and unread count for the authenticated user
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const filter = req.query.filter === 'unread' ? 'unread' : 'all';
    const result = await notificationsService.getUserNotifications(userId, filter);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err: any) {
    console.error("Error fetching notifications:", err);
    return res.status(500).json({ success: false, message: err?.message || "Error fetching notifications" });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Notification ID is required" });
    }

    await notificationsService.markAsRead(userId, id);
    return res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (err: any) {
    console.error("Error marking notification as read:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications for the authenticated user as read
 */
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await notificationsService.markAllAsRead(userId);
    return res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (err: any) {
    console.error("Error marking all notifications as read:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Notification ID is required" });
    }

    await notificationsService.deleteNotification(userId, id);
    return res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (err: any) {
    console.error("Error deleting notification:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};

/**
 * GET /api/notifications/settings
 */
export const getNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const settings = await notificationsService.getNotificationSettings(userId);
    return res.status(200).json({ success: true, data: settings });
  } catch (err: any) {
    console.error("Error fetching notification settings:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};

/**
 * PUT /api/notifications/settings
 */
export const updateNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updatedSettings = await notificationsService.updateNotificationSettings(
      userId,
      req.body
    );

    return res.status(200).json({ success: true, data: updatedSettings });
  } catch (err: any) {
    console.error("Error updating notification settings:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};
