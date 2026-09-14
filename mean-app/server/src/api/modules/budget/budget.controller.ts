import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as budgetService from './budget.service.js';

// Create budget
export async function createBudget(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { category, amount, month, description } = req.body;

    if (!category || typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ success: false, message: 'Category is required' });
      return;
    }

    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({ success: false, message: 'Budget amount must be greater than 0' });
      return;
    }

    if (!month) {
      res.status(400).json({ success: false, message: 'Month date is required' });
      return;
    }

    const parsedMonth = new Date(month);
    if (isNaN(parsedMonth.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid month date format' });
      return;
    }

    const newBudget = await budgetService.createBudget({
      category: category.trim(),
      amount: Number(amount),
      month: parsedMonth,
      description: description ? String(description).trim() : null,
      userId
    });

    res.status(201).json({ success: true, data: newBudget });
  } catch (error: any) {
    const msg = error?.message || 'Error creating budget';
    if (msg.includes('required') || msg.includes('greater than 0') || msg.includes('Invalid')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    console.error('Create budget error:', error);
    res.status(500).json({ success: false, message: 'Error creating budget' });
  }
}

// Get budgets (scoped to logged-in user with real-time calculated spending)
export async function getBudgets(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const budgets = await budgetService.getBudgetsByUserId(userId);
    res.status(200).json({ success: true, data: budgets });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ success: false, message: 'Error fetching budgets' });
  }
}

// Update budget (with ownership check & re-calculated spending)
export async function updateBudget(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, message: 'Budget ID is required' });
      return;
    }

    const { category, amount, month, description } = req.body;

    if (category !== undefined && (!category || typeof category !== 'string' || !category.trim())) {
      res.status(400).json({ success: false, message: 'Category cannot be empty' });
      return;
    }

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      res.status(400).json({ success: false, message: 'Budget amount must be greater than 0' });
      return;
    }

    if (month !== undefined) {
      const parsedMonth = new Date(month);
      if (isNaN(parsedMonth.getTime())) {
        res.status(400).json({ success: false, message: 'Invalid month date format' });
        return;
      }
    }

    const updatedBudget = await budgetService.updateBudget(id, userId, {
      category,
      amount: amount !== undefined ? Number(amount) : undefined,
      month,
      description
    });

    if (!updatedBudget) {
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    res.status(200).json({ success: true, data: updatedBudget });
  } catch (error: any) {
    const msg = error?.message || 'Error updating budget';
    if (msg.includes('empty') || msg.includes('greater than 0') || msg.includes('Invalid')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    console.error('Update budget error:', error);
    res.status(500).json({ success: false, message: 'Error updating budget' });
  }
}

// Delete budget (with ownership check)
export async function deleteBudget(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, message: 'Budget ID is required' });
      return;
    }

    const deletedBudget = await budgetService.deleteBudget(id, userId);
    if (!deletedBudget) {
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ success: false, message: 'Error deleting budget' });
  }
}