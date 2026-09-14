import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as budgetService from './budget.service.js';
import type { Budget } from './budget.model.js';

// ✅ Create budget
export async function createBudget(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { category, amount, month, description } = req.body as Partial<Budget>;

    if (!req.user?.id) {
      res.status(400).json({ message: 'User ID is missing from token' });
      return;
    }

    const newBudget = await budgetService.createBudget({
      category: String(category),
      amount: Number(amount),
      month: new Date(String(month)),
      description: description ?? '',
      userId: req.user.id,
      spent: 0
    });

    res.status(201).json(newBudget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating budget', error });
  }
}

// ✅ Get budgets (by logged-in user)
export async function getBudgets(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user?.id) {
      res.status(400).json({ message: 'User ID is missing from token' });
      return;
    }

    const budgets = await budgetService.getBudgetsByUserId(req.user.id);
    res.status(200).json(budgets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
}

// ✅ Update budget
export async function updateBudget(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, message: 'Budget ID is required.' });
      return;
    }

    const updatedBudget = await budgetService.updateBudget(id, userId, req.body as any);
    if (!updatedBudget) {
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    res.status(200).json(updatedBudget);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ success: false, message: 'Error updating budget' });
  }
}

// ✅ Delete budget
export async function deleteBudget(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, message: 'Budget ID is required.' });
      return;
    }

    const deletedBudget = await budgetService.deleteBudget(id, userId);
    if (!deletedBudget) {
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Budget deleted successfully', data: deletedBudget });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ success: false, message: 'Error deleting budget' });
  }
}