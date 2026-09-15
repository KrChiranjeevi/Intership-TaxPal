// src/api/modules/recurring/recurring.controller.ts
import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as recurringService from './recurring.service.js';

export async function getRecurring(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const data = await recurringService.getRecurringTransactions(userId);
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}

export async function createRecurring(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { title, amount, category, type, frequency, startDate } = req.body;
    if (!title || amount === undefined || !type || !frequency) {
      return res.status(400).json({ success: false, message: 'Title, amount, type, and frequency are required' });
    }

    const created = await recurringService.createRecurringTransaction(userId, {
      title,
      amount: Number(amount),
      category,
      type,
      frequency,
      startDate
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}

export async function updateRecurring(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id as string;
    if (!id) return res.status(400).json({ success: false, message: 'Recurring transaction ID is required' });

    await recurringService.updateRecurringTransaction(userId, id, req.body);
    return res.status(200).json({ success: true, message: 'Recurring transaction updated' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}

export async function toggleStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id as string;
    if (!id) return res.status(400).json({ success: false, message: 'Recurring transaction ID is required' });

    const { status } = req.body;
    if (status !== 'active' && status !== 'paused') {
      return res.status(400).json({ success: false, message: 'Status must be active or paused' });
    }

    await recurringService.toggleRecurringStatus(userId, id, status);
    return res.status(200).json({ success: true, message: `Status updated to ${status}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}

export async function deleteRecurring(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id as string;
    if (!id) return res.status(400).json({ success: false, message: 'Recurring transaction ID is required' });

    await recurringService.deleteRecurringTransaction(userId, id);
    return res.status(200).json({ success: true, message: 'Recurring transaction deleted' });

  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}

export async function runProcess(req: AuthRequest, res: Response) {
  try {
    const result = await recurringService.processDueRecurringTransactions();
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}
