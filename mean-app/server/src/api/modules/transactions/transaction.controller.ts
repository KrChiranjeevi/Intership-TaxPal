import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as transactionService from './transaction.service.js';
import type { TransactionFilters, TransactionType } from './transaction.model.js';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { type, amount, category, description, date, notes } = req.body;

    if (!type || !['income', 'expense'].includes(String(type).toLowerCase())) {
      return res.status(400).json({ success: false, message: "Type must be either 'income' or 'expense'" });
    }
    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    const payload = {
      type: String(type).toLowerCase() as TransactionType,
      amount: Number(amount),
      category: category ? String(category).trim() : 'General',
      description: String(description).trim(),
      date: date ? new Date(date) : new Date(),
      notes: notes ? String(notes).trim() : undefined,
      userId,
    };

    const transaction = await transactionService.createTransaction(payload);
    return res.status(201).json({ success: true, data: transaction });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message || 'Failed to create transaction' });
  }
};

export const getAllTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const filters: TransactionFilters = {};

    // 1. Search filter
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      filters.search = req.query.search.trim();
    }

    // 2. Type filter
    if (typeof req.query.type === 'string') {
      const typeLower = req.query.type.toLowerCase();
      if (typeLower === 'income' || typeLower === 'expense') {
        filters.type = typeLower as TransactionType;
      }
    }

    // 3. Category filter
    if (typeof req.query.category === 'string' && req.query.category.trim() && req.query.category.toLowerCase() !== 'all') {
      filters.category = req.query.category.trim();
    }

    // 4. Date filter
    let parsedStart: Date | undefined;
    let parsedEnd: Date | undefined;

    if (req.query.startDate) {
      parsedStart = new Date(req.query.startDate as string);
      if (isNaN(parsedStart.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid start date format' });
      }
      parsedStart.setHours(0, 0, 0, 0);
      filters.startDate = parsedStart;
    }

    if (req.query.endDate) {
      parsedEnd = new Date(req.query.endDate as string);
      if (isNaN(parsedEnd.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid end date format' });
      }
      parsedEnd.setHours(23, 59, 59, 999);
      filters.endDate = parsedEnd;
    }

    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    // 5. Pagination filters
    if (req.query.page) {
      const pageNum = parseInt(req.query.page as string, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        filters.page = pageNum;
      }
    }

    if (req.query.limit) {
      const limitNum = parseInt(req.query.limit as string, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        filters.limit = Math.min(50, limitNum);
      }
    }

    const result = await transactionService.getAllTransactions(userId, filters);
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message || 'Error fetching transactions' });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Transaction ID is required' });

    const transaction = await transactionService.getTransactionById(id, userId);
    return res.status(200).json({ success: true, data: transaction });
  } catch (err: any) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Transaction ID is required' });

    const updatePayload: any = { ...req.body };
    if (updatePayload.date) {
      const parsedDate = new Date(updatePayload.date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      updatePayload.date = parsedDate;
    }
    if (updatePayload.amount !== undefined && (isNaN(Number(updatePayload.amount)) || Number(updatePayload.amount) <= 0)) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }
    if (updatePayload.type && !['income', 'expense'].includes(String(updatePayload.type).toLowerCase())) {
      return res.status(400).json({ success: false, message: "Type must be either 'income' or 'expense'" });
    }

    const updatedTransaction = await transactionService.updateTransaction(id, userId, updatePayload);
    return res.status(200).json({ success: true, data: updatedTransaction });
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('not found') || msg.includes('not authorized')) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    return res.status(400).json({ success: false, message: msg || 'Failed to update transaction' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Transaction ID is required' });

    const result = await transactionService.deleteTransaction(id, userId);
    return res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('not found') || msg.includes('not authorized')) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    return res.status(400).json({ success: false, message: msg || 'Failed to delete transaction' });
  }
};