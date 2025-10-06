// src/modules/notifications/notifications.service.ts
import { prisma } from '../../../config/prisma.client.js';
import type { NotificationSettingsDto } from './notifications.model.js';

// Get settings for a user
export async function getNotificationSettings(userId: string) {
  //return prisma.userNotificationSetting.findUnique({
    //where: { userId },
  //});
}

// Create settings for a user (only if none exists)
export async function createNotificationSettings(
  userId: string,
  data: NotificationSettingsDto
) {
  /*return prisma.userNotificationSetting.create({
    data: {
      userId,
      ...data,
    },
  });*/
}

// Update settings for a user
export async function updateNotificationSettings(
  userId: string,
  data: Partial<NotificationSettingsDto>
) {
  /*return prisma.userNotificationSetting.update({
    where: { userId },
    data,
  });*/
}
