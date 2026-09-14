import { prisma } from '../../../config/prisma.client.js';
import type {
  Budget,
  CalculatedBudget,
  BudgetSpendingDetails,
  CreateBudgetInput,
  UpdateBudgetInput
} from './budget.model.js';

/**
 * Returns UTC start and end bounds for the month corresponding to a given date.
 */
export function getMonthDateRange(monthDate: Date | string): { startDate: Date; endDate: Date } {
  const d = new Date(monthDate);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  return { startDate, endDate };
}

/**
 * Pure calculation helper: takes budget limit and an array of expense records,
 * and returns spent, remaining, percentageUsed, and isOverBudget.
 */
export function calculateBudgetSpending(
  budgetAmount: number,
  matchingExpenses: Array<{ amount: number }>
): BudgetSpendingDetails {
  const rawSpent = matchingExpenses.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const spent = Number(rawSpent.toFixed(2));
  const remaining = Math.max(0, Number((budgetAmount - spent).toFixed(2)));
  const percentageUsed = budgetAmount > 0 ? Number(((spent / budgetAmount) * 100).toFixed(1)) : 0;
  const isOverBudget = spent > budgetAmount;

  return {
    spent,
    remaining,
    percentageUsed,
    isOverBudget
  };
}

/**
 * Helper to compute and attach real spending metrics to a single budget entity.
 */
export async function attachSpendingToBudget(budget: Budget, userId: string): Promise<CalculatedBudget> {
  const { startDate, endDate } = getMonthDateRange(budget.month);
  const bMonthUTC = new Date(budget.month).getUTCMonth();
  const bYearUTC = new Date(budget.month).getUTCFullYear();
  const bCat = budget.category.trim().toLowerCase();

  const userExpenses = await prisma.transaction.findMany({
    where: {
      userId,
      type: { equals: 'expense', mode: 'insensitive' },
      category: { equals: budget.category.trim(), mode: 'insensitive' }
    },
    select: { amount: true, date: true }
  });

  const matching = userExpenses.filter((tx) => {
    const txDate = new Date(tx.date);
    const inRange = txDate >= startDate && txDate <= endDate;
    const sameUtcMonth = txDate.getUTCFullYear() === bYearUTC && txDate.getUTCMonth() === bMonthUTC;
    return inRange || sameUtcMonth;
  });

  const calc = calculateBudgetSpending(Number(budget.amount), matching);

  return {
    ...budget,
    spent: calc.spent,
    remaining: calc.remaining,
    percentageUsed: calc.percentageUsed,
    isOverBudget: calc.isOverBudget
  };
}

/**
 * Create a new budget with validation and return with calculated spending.
 */
export async function createBudget(data: CreateBudgetInput): Promise<CalculatedBudget> {
  if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
    throw new Error('Category is required');
  }

  const numAmount = Number(data.amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Budget amount must be greater than 0');
  }

  const parsedMonth = new Date(data.month);
  if (isNaN(parsedMonth.getTime())) {
    throw new Error('Invalid month date provided');
  }

  const newBudget = await prisma.budget.create({
    data: {
      category: data.category.trim(),
      amount: numAmount,
      month: parsedMonth,
      description: data.description ? data.description.trim() : null,
      userId: data.userId,
      spent: 0
    }
  });

  return await attachSpendingToBudget(newBudget, data.userId);
}

/**
 * Get all budgets for a user with actual spending dynamically calculated
 * from their expense transactions in a single batch query (avoiding N+1 queries).
 */
export async function getBudgetsByUserId(userId: string): Promise<CalculatedBudget[]> {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { month: 'desc' }
  });

  if (budgets.length === 0) {
    return [];
  }

  // Batch query all expense transactions for this user once
  const expenses = await prisma.transaction.findMany({
    where: {
      userId,
      type: { equals: 'expense', mode: 'insensitive' }
    },
    select: {
      amount: true,
      category: true,
      date: true
    }
  });

  return budgets.map((b) => {
    const { startDate, endDate } = getMonthDateRange(b.month);
    const bMonthUTC = new Date(b.month).getUTCMonth();
    const bYearUTC = new Date(b.month).getUTCFullYear();
    const bCat = b.category.trim().toLowerCase();

    const matching = expenses.filter((tx) => {
      if (!tx.category) return false;
      if (tx.category.trim().toLowerCase() !== bCat) return false;

      const txDate = new Date(tx.date);
      const inRange = txDate >= startDate && txDate <= endDate;
      const sameUtcMonth = txDate.getUTCFullYear() === bYearUTC && txDate.getUTCMonth() === bMonthUTC;
      return inRange || sameUtcMonth;
    });

    const calc = calculateBudgetSpending(Number(b.amount), matching);

    return {
      ...b,
      spent: calc.spent,
      remaining: calc.remaining,
      percentageUsed: calc.percentageUsed,
      isOverBudget: calc.isOverBudget
    };
  });
}

/**
 * Update a budget with ownership verification and re-calculate spending metrics.
 */
export async function updateBudget(
  id: string,
  userId: string,
  data: UpdateBudgetInput
): Promise<CalculatedBudget | null> {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const updateData: any = {};
  if (data.category !== undefined) {
    if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
      throw new Error('Category cannot be empty');
    }
    updateData.category = data.category.trim();
  }

  if (data.amount !== undefined) {
    const numAmount = Number(data.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Budget amount must be greater than 0');
    }
    updateData.amount = numAmount;
  }

  if (data.month !== undefined) {
    const parsedMonth = new Date(data.month);
    if (isNaN(parsedMonth.getTime())) {
      throw new Error('Invalid month date provided');
    }
    updateData.month = parsedMonth;
  }

  if (data.description !== undefined) {
    updateData.description = data.description ? data.description.trim() : null;
  }

  const updated = await prisma.budget.update({
    where: { id },
    data: updateData
  });

  return await attachSpendingToBudget(updated, userId);
}

/**
 * Delete a budget with strict user ownership verification.
 */
export async function deleteBudget(id: string, userId: string): Promise<Budget | null> {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;

  return await prisma.budget.delete({ where: { id } });
}

