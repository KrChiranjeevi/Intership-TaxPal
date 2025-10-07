// src/api/modules/notifications/notifications.service.ts
import {
  getNotificationSettings as getSettingsModel,
  updateNotificationSettings as updateSettingsModel,
  type NotificationSettingsInput,
} from "./notifications.model.js";

// Get settings for a user
export const getNotificationSettings = async (userId: string) => {
  if (!userId) throw new Error("User ID is required");
  return await getSettingsModel(userId);
};

// Update settings for a user
export const updateNotificationSettings = async (
  userId: string,
  data: NotificationSettingsInput
) => {
  if (!userId) throw new Error("User ID is required");
  return await updateSettingsModel(userId, data);
};
