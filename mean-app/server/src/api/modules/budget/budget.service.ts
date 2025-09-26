// budget.service.ts

import { PrismaClient } from '@prisma/client';
import { Budget } from './budget.model';

const prisma = new PrismaClient();

// Create a new budget
export async function createBudget(budgetData: Omit<Budget, 'id'>): Promise<Budget> {
    const newBudget = await prisma.budget.create({
        data: budgetData,
    });
    return newBudget;
}

// Get all budgets for a specific user
export async function getBudgetsByUserId(userId: number): Promise<Budget[]> {
    const budgets = await prisma.budget.findMany({
        where: { userId },
    });
    return budgets;
}

// Update an existing budget
export async function updateBudget(id: number, budgetData: Partial<Budget>): Promise<Budget> {
    const updatedBudget = await prisma.budget.update({
        where: { id },
        data: budgetData,
    });
    return updatedBudget;
}

// Delete a budget
export async function deleteBudget(id: number): Promise<Budget> {
    const deletedBudget = await prisma.budget.delete({
        where: { id },
    });
    return deletedBudget;
}
