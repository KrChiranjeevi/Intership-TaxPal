import { prisma } from '../../../config/prisma.client.js';
import type { Budget } from './budget.model.js';

// Create a new budget
export async function createBudget(budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> & { description?: string | null; spent?: number }): Promise<Budget> {
  return prisma.budget.create({
    data: {
      ...budgetData,
      month: new Date(budgetData.month),
      description: budgetData.description ?? null,
      amount: Number(budgetData.amount),
      spent: Number(budgetData.spent ?? 0),
    },
  });
}

// Get all budgets for a specific user
export async function getBudgetsByUserId(userId: string): Promise<Budget[]> {
  return prisma.budget.findMany({ where: { userId } });
}

// Update an existing budget (with ownership check)
export async function updateBudget(
  id: string,
  userId: string,
  budgetData: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> & { description?: string | null }
): Promise<Budget | null> {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: any = {};
  if (budgetData.category !== undefined) data.category = budgetData.category;
  if (budgetData.amount !== undefined) data.amount = Number(budgetData.amount);
  if (budgetData.spent !== undefined) data.spent = Number(budgetData.spent);
  if (budgetData.month !== undefined) data.month = new Date(budgetData.month);
  if (budgetData.description !== undefined) data.description = budgetData.description;

  return prisma.budget.update({ where: { id }, data });
}

// Delete a budget (with ownership check)
export async function deleteBudget(id: string, userId: string): Promise<Budget | null> {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;

  return prisma.budget.delete({ where: { id } });
}
