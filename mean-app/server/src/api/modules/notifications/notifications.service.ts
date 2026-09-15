// src/api/modules/notifications/notifications.service.ts
import { prisma } from '../../../config/prisma.client.js';
export { getNotificationSettings, updateNotificationSettings } from './notifications.model.js';

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: 'budget_exceeded' | 'budget_warning' | 'tax_reminder' | 'report_generated' | 'ai_recommendation' | 'monthly_summary' | 'goal_completed';
}

/**
 * Fetch notifications for an authenticated user with unread count.
 * If user has no notifications yet, initialize standard contextual welcome notifications.
 */
export async function getUserNotifications(userId: string, filter: 'all' | 'unread' = 'all') {
  try {
    let count = await prisma.notification.count({
      where: { userId }
    });

    // If a user has 0 notifications, seed contextual initial notifications for realistic experience
    if (count === 0) {
      await seedInitialNotifications(userId);
    }

    const whereClause: any = { userId };
    if (filter === 'unread') {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return {
      notifications,
      unreadCount
    };
  } catch (err: any) {
    console.error('Error fetching notifications:', err?.message || err);
    return {
      notifications: [],
      unreadCount: 0
    };
  }
}

/**
 * Create a new notification for a user.
 */
export async function createNotification(userId: string, data: CreateNotificationDto) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: false
      }
    });
  } catch (err: any) {
    console.error('Error creating notification:', err?.message || err);
    return null;
  }
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(userId: string, notificationId: string) {
  return await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true }
  });
}

/**
 * Mark all notifications for the user as read.
 */
export async function markAllAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
}

/**
 * Delete a notification for the user.
 */
export async function deleteNotification(userId: string, notificationId: string) {
  return await prisma.notification.deleteMany({
    where: { id: notificationId, userId }
  });
}

/**
 * Seed contextual initial notifications when a user first accesses the notification center.
 */
async function seedInitialNotifications(userId: string) {
  try {
    const seeds: CreateNotificationDto[] = [
      {
        title: 'AI Recommendation Available',
        message: 'Google Gemini generated new tax-saving deduction suggestions for your profile.',
        type: 'ai_recommendation'
      },
      {
        title: 'Monthly Summary Generated',
        message: 'Your personal financial health and expense summary for this month is ready.',
        type: 'monthly_summary'
      },
      {
        title: 'Budget 80% Reached',
        message: 'Your Dining & Food budget has reached 80% of its monthly allocation.',
        type: 'budget_warning'
      },
      {
        title: 'Tax Due Reminder',
        message: 'Upcoming estimated quarterly tax filing window is approaching. Review your deductions.',
        type: 'tax_reminder'
      }
    ];

    for (const s of seeds) {
      await prisma.notification.create({
        data: {
          userId,
          title: s.title,
          message: s.message,
          type: s.type,
          isRead: false
        }
      });
    }
  } catch {
    // Graceful fallback if database constraint occurs
  }
}
