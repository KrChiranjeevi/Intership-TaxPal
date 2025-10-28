import { PrismaClient } from '@prisma/client';
import type { Budget } from './budget.model.js';

const prisma = new PrismaClient();

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

// Update an existing budget
export async function updateBudget(id: string, budgetData: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> & { description?: string | null }): Promise<Budget> {
  const data: any = {};

  if (budgetData.category !== undefined) data.category = budgetData.category;
  if (budgetData.amount !== undefined) data.amount = Number(budgetData.amount);
  if (budgetData.spent !== undefined) data.spent = Number(budgetData.spent);
  if (budgetData.month !== undefined) data.month = new Date(budgetData.month);
  data.description = budgetData.description ?? null;

  try {
    return await prisma.budget.update({ where: { id }, data });
  } catch (err) {
    console.error(`Error updating budget with id=${id}:`, err);
    throw err; // let controller return 500
  }
}

// Delete a budget
export async function deleteBudget(id: string): Promise<Budget> {
  return prisma.budget.delete({ where: { id } });
}
