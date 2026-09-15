// src/api/modules/goals/goals.controller.ts
import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as goalsService from './goals.service.js';

export async function getGoals(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const goals = await goalsService.getGoals(userId);
    return res.status(200).json({ success: true, data: goals });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}

export async function createGoal(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, targetAmount, currentAmount, category, deadline } = req.body;
    if (!name || targetAmount === undefined || !deadline) {
      return res.status(400).json({ success: false, message: 'Name, target amount, and deadline are required' });
    }

    const goal = await goalsService.createGoal(userId, {
      name,
      targetAmount: Number(targetAmount),
      currentAmount: currentAmount !== undefined ? Number(currentAmount) : 0,
      category,
      deadline
    });

    return res.status(201).json({ success: true, data: goal });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}

export async function updateGoal(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id as string;
    if (!id) return res.status(400).json({ success: false, message: 'Goal ID is required' });

    const goal = await goalsService.updateGoal(userId, id, req.body);
    return res.status(200).json({ success: true, data: goal });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}

export async function contribute(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id as string;
    if (!id) return res.status(400).json({ success: false, message: 'Goal ID is required' });

    const { amount } = req.body;
    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'A positive contribution amount is required' });
    }

    const updated = await goalsService.contributeToGoal(userId, id, Number(amount));
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}

export async function deleteGoal(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id as string;
    if (!id) return res.status(400).json({ success: false, message: 'Goal ID is required' });

    await goalsService.deleteGoal(userId, id);
    return res.status(200).json({ success: true, message: 'Goal deleted' });

  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}
