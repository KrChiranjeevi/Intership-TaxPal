// src/api/modules/notifications/notifications.controller.ts
import type { Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import * as notificationsService from "./notifications.service.js";

export const getNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const settings = await notificationsService.getNotificationSettings(userId);
    res.status(200).json({ success: true, data: settings });
  } catch (err: any) {
    console.error("Error fetching notification settings:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const updatedSettings = await notificationsService.updateNotificationSettings(
      userId,
      req.body
    );

    res.status(200).json({ success: true, data: updatedSettings });
  } catch (err: any) {
    console.error("Error updating notification settings:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
