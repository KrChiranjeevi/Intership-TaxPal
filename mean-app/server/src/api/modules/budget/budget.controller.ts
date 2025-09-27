import type { Request, Response } from 'express';
import * as budgetService from './budget.service.js';
import type { Budget } from './budget.model.js';

// Create budget
export async function createBudget(req: Request, res: Response): Promise<void> {
  try {
    const { category, amount, month, description, userId } = req.body as Partial<Budget>;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ message: 'User ID is required and must be a string (UUID).' });
      return;
    }

    const newBudget = await budgetService.createBudget({
      category: String(category),
      amount: Number(amount),
      month: new Date(String(month)),
      description: description ?? '',
      userId, // already string
    });

    res.status(201).json(newBudget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating budget', error });
  }
}

// Get budgets
export async function getBudgets(req: Request, res: Response): Promise<void> {
  try {
    const userIdParam = req.query.userId;

    if (!userIdParam || typeof userIdParam !== 'string') {
      res.status(400).json({ message: 'User ID is required and must be a string (UUID).' });
      return;
    }

    const budgets = await budgetService.getBudgetsByUserId(userIdParam);
    res.status(200).json(budgets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
}

// Update budget
export async function updateBudget(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Budget ID is required and must be a string (UUID).' });
      return;
    }

    const updatedBudget = await budgetService.updateBudget(id, req.body as Partial<Budget>);
    res.status(200).json(updatedBudget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating budget', error });
  }
}

// Delete budget
export async function deleteBudget(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Budget ID is required and must be a string (UUID).' });
      return;
    }

    const deletedBudget = await budgetService.deleteBudget(id);
    res.status(200).json(deletedBudget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting budget', error });
  }
}
