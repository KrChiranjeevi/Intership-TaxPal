// src/modules/notifications/notifications.model.ts
import { z } from 'zod';

export const NotificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  transactionAlerts: z.boolean().optional(),
  budgetWarnings: z.boolean().optional(),
  taxReminders: z.boolean().optional(),
});

export type NotificationSettingsDto = z.infer<typeof NotificationSettingsSchema>;
