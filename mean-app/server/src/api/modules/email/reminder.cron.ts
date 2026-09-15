// src/api/modules/email/reminder.cron.ts
// Cron-like scheduler for sending budget alerts, tax reminders, and weekly summaries.
// Uses setInterval since node-cron is not installed; gracefully skips if email is unconfigured.

import { prisma } from '../../../config/prisma.client.js';
import {
  sendEmail,
  budgetAlertTemplate,
  taxReminderTemplate,
  weeklySummaryTemplate
} from './email.service.js';

let schedulerStarted = false;

/**
 * Send budget alerts for users whose budgets have exceeded 80% or 100% of their limit.
 * Runs once per day.
 */
async function sendBudgetAlerts() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get all active budgets
    const budgets = await (prisma as any).budget?.findMany?.({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            notificationSettings: true
          }
        }
      }
    }).catch(() => []) ?? [];

    for (const budget of budgets) {
      if (!budget.user?.email || budget.user.isActive === false) continue;

      // Respect notification preferences
      const notifPrefs = budget.user.notificationSettings;
      if (notifPrefs && (!notifPrefs.emailNotifications || !notifPrefs.budgetWarnings)) {
        continue;
      }

      // Sum expenses for this category in current month
      const spent = await prisma.transaction.aggregate({
        where: {
          userId: budget.userId,
          type: 'expense',
          category: budget.category,
          date: { gte: monthStart, lte: monthEnd }
        },
        _sum: { amount: true }
      });

      const totalSpent = Number(spent._sum?.amount || 0);
      const limit = Number(budget.limit || 0);
      if (limit <= 0) continue;

      const percentage = Math.round((totalSpent / limit) * 100);

      if (percentage >= 80) {
        await sendEmail({
          to: budget.user.email,
          subject: `⚠️ Budget Alert: ${budget.category} at ${percentage}%`,
          html: budgetAlertTemplate(budget.user.name || 'User', budget.category, totalSpent, limit, percentage)
        });
      }
    }
  } catch (err) {
    console.error('[ReminderCron] Budget alerts error:', err);
  }
}

/**
 * Send weekly summary emails every Sunday (or on schedule call).
 */
async function sendWeeklySummaries() {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        notificationSettings: true
      }
    }).catch(() => []);

    for (const user of users) {
      if (!user.email || user.isActive === false) continue;

      // Respect notification preferences
      if (user.notificationSettings && !user.notificationSettings.emailNotifications) {
        continue;
      }

      const txs = await prisma.transaction.findMany({
        where: { userId: user.id, date: { gte: weekStart, lte: now } },
        select: { type: true, amount: true, category: true }
      });

      const weekIncome  = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const weekExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

      const catMap: Record<string, number> = {};
      txs.filter(t => t.type === 'expense').forEach(t => {
        const c = t.category || 'Uncategorized';
        catMap[c] = (catMap[c] || 0) + Number(t.amount);
      });
      const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

      if (weekIncome === 0 && weekExpense === 0) continue; // Skip inactive users

      await sendEmail({
        to: user.email,
        subject: `📊 TaxPal Weekly Summary — ${now.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}`,
        html: weeklySummaryTemplate(user.name || 'User', weekIncome, weekExpense, weekIncome - weekExpense, topCategory)
      });
    }
  } catch (err) {
    console.error('[ReminderCron] Weekly summary error:', err);
  }
}

/**
 * Start the reminder scheduler.
 * - Budget alerts: runs every 24 hours
 * - Weekly summaries: runs every Sunday (detected by day)
 */
export function startReminderScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // Check if SMTP is configured before starting
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!smtpConfigured) {
    console.log('[ReminderCron] SMTP not configured. Reminder emails are disabled.');
    return;
  }

  console.log('[ReminderCron] Starting reminder scheduler...');

  // Run budget alerts every 24 hours
  setInterval(() => {
    sendBudgetAlerts().catch(console.error);
  }, 24 * 60 * 60 * 1000);

  // Run weekly summary check every 24 hours; only sends on Sundays
  setInterval(() => {
    const day = new Date().getDay(); // 0 = Sunday
    if (day === 0) {
      sendWeeklySummaries().catch(console.error);
    }
  }, 24 * 60 * 60 * 1000);

  console.log('[ReminderCron] Scheduler started. Budget alerts: daily. Weekly summaries: Sundays.');
}
