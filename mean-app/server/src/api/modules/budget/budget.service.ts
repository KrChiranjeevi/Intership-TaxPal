import { PrismaClient } from '@prisma/client';
import type { Budget } from './budget.model.js';

const prisma = new PrismaClient();

// Helper type to match Prisma's expected input
type BudgetCreateInput = Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> & {
  description?: string | null; // optional for Prisma
};

// Create a new budget
export async function createBudget(budgetData: BudgetCreateInput): Promise<Budget> {
  return prisma.budget.create({ data: budgetData });
}

// Get all budgets for a specific user
export async function getBudgetsByUserId(userId: string): Promise<Budget[]> {
  return prisma.budget.findMany({ where: { userId } });
}

// Update an existing budget
export async function updateBudget(id: string, budgetData: Partial<Budget>): Promise<Budget> {
  // Convert undefined description to null if needed
  const data = { ...budgetData, description: budgetData.description ?? null };
  return prisma.budget.update({ where: { id }, data });
}

// Delete a budget
export async function deleteBudget(id: string): Promise<Budget> {
  return prisma.budget.delete({ where: { id } });
}