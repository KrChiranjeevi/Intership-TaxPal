// src/api/modules/recurring/recurring.service.ts
import { prisma } from '../../../config/prisma.client.js';
import type { CreateRecurringDto, UpdateRecurringDto, RecurringFrequency, RecurringStatus } from './recurring.model.js';
import { createNotification } from '../notifications/notifications.service.js';

/**
 * Helper to compute next execution timestamp based on frequency.
 */
export function computeNextRun(baseDate: Date, frequency: RecurringFrequency): Date {
  const next = new Date(baseDate.getTime());
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

/**
 * Fetch all recurring transaction rules for a user.
 */
export async function getRecurringTransactions(userId: string) {
  return await prisma.recurringTransaction.findMany({
    where: { userId },
    orderBy: { nextRun: 'asc' }
  });
}

/**
 * Create a new recurring transaction rule.
 */
export async function createRecurringTransaction(userId: string, data: CreateRecurringDto) {
  const start = data.startDate ? new Date(data.startDate) : new Date();
  const nextRun = computeNextRun(start, data.frequency);

  return await prisma.recurringTransaction.create({
    data: {
      userId,
      title: data.title.trim(),
      amount: Number(data.amount),
      category: data.category?.trim() || 'Other',
      type: data.type === 'income' ? 'income' : 'expense',
      frequency: data.frequency,
      nextRun,
      status: 'active'
    }
  });
}

/**
 * Update recurring transaction.
 */
export async function updateRecurringTransaction(userId: string, id: string, data: UpdateRecurringDto) {
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.amount !== undefined) updateData.amount = Number(data.amount);
  if (data.category !== undefined) updateData.category = data.category.trim();
  if (data.type !== undefined) updateData.type = data.type;
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.nextRun !== undefined) updateData.nextRun = new Date(data.nextRun);

  return await prisma.recurringTransaction.updateMany({
    where: { id, userId },
    data: updateData
  });
}

/**
 * Toggle status of a recurring transaction (active / paused).
 */
export async function toggleRecurringStatus(userId: string, id: string, status: RecurringStatus) {
  return await prisma.recurringTransaction.updateMany({
    where: { id, userId },
    data: { status }
  });
}

/**
 * Delete a recurring transaction.
 */
export async function deleteRecurringTransaction(userId: string, id: string) {
  return await prisma.recurringTransaction.deleteMany({
    where: { id, userId }
  });
}

/**
 * Background processor: automatically generates actual Transactions for due recurring items
 * and advances their nextRun date.
 */
export async function processDueRecurringTransactions(): Promise<{ processed: number }> {
  const now = new Date();
  const dueItems = await prisma.recurringTransaction.findMany({
    where: {
      status: 'active',
      nextRun: { lte: now }
    }
  });

  let processed = 0;

  for (const item of dueItems) {
    try {
      // 1. Create real transaction entry
      await prisma.transaction.create({
        data: {
          userId: item.userId,
          description: item.title,
          notes: `Recurring ${item.frequency} transaction`,
          amount: item.amount,
          type: item.type,
          category: item.category || 'Recurring',
          date: now
        }
      });


      // 2. Compute next run date
      const nextRun = computeNextRun(item.nextRun, item.frequency as RecurringFrequency);
      await prisma.recurringTransaction.update({
        where: { id: item.id },
        data: { nextRun }
      });

      // 3. Emit notification
      await createNotification(item.userId, {
        title: 'Recurring Payment Processed',
        message: `${item.title} ($${item.amount.toFixed(2)}) has been automatically recorded.`,
        type: 'monthly_summary'
      });

      processed++;
    } catch (err: any) {
      console.error(`Failed to process recurring item ${item.id}:`, err?.message || err);
    }
  }

  return { processed };
}
