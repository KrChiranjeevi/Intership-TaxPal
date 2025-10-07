// src/api/modules/notifications/notifications.model.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface NotificationSettingsInput {
  emailNotifications?: boolean;
  transactionAlerts?: boolean;
  budgetWarnings?: boolean;
  taxReminders?: boolean;
}

// Get user notification settings
export const getNotificationSettings = async (userId: string) => {
  let settings = await prisma.userNotificationSetting.findUnique({
    where: { userId },
  });

  // If no settings found, create defaults automatically
  if (!settings) {
    settings = await prisma.userNotificationSetting.create({
      data: {
        userId,
        emailNotifications: true,
        transactionAlerts: true,
        budgetWarnings: true,
        taxReminders: true,
      },
    });
  }

  return settings;
};

// Update or create user notification settings
export const updateNotificationSettings = async (
  userId: string,
  data: NotificationSettingsInput
) => {
  const existing = await prisma.userNotificationSetting.findUnique({
    where: { userId },
  });

  if (existing) {
    return await prisma.userNotificationSetting.update({
      where: { userId },
      data,
    });
  }

  return await prisma.userNotificationSetting.create({
    data: {
      userId,
      ...data,
    },
  });
};
