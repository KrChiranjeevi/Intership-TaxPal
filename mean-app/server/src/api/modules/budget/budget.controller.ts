// budget.controller.ts

import type { Request, Response } from 'express';
// Corrected import path for budget.service.ts
import * as budgetService from './budget.service.js';

// Handler for creating a new budget
export async function createBudget(req: Request, res: Response): Promise<void> {
    try {
        const { category, amount, month, description, userId } = req.body;
        const newBudget = await budgetService.createBudget({
            category,
            amount: parseFloat(amount),
            month: new Date(month),
            description,
            userId: parseInt(userId),
        });
        res.status(201).json(newBudget);
    } catch (error) {
        res.status(500).json({ message: 'Error creating budget', error });
    }
}

// Handler for getting all budgets for a user
export async function getBudgets(req: Request, res: Response): Promise<void> {
    try {
        const userId = parseInt(req.query.userId as string);
        if (!userId) {
            res.status(400).json({ message: 'User ID is required.' });
            return;
        }
        const budgets = await budgetService.getBudgetsByUserId(userId);
        res.status(200).json(budgets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching budgets', error });
    }
}

// Handler for updating a budget
export async function updateBudget(req: Request, res: Response): Promise<void> {
    try {
        const id = parseInt(req.params.id);
        const updatedBudget = await budgetService.updateBudget(id, req.body);
        res.status(200).json(updatedBudget);
    } catch (error) {
        res.status(500).json({ message: 'Error updating budget', error });
    }
}

// Handler for deleting a budget
export async function deleteBudget(req: Request, res: Response): Promise<void> {
    try {
        const id = parseInt(req.params.id);
        const deletedBudget = await budgetService.deleteBudget(id);
        res.status(200).json(deletedBudget);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting budget', error });
    }
}
