import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as transactionService from './transaction.service.js';

type TransactionType = 'income' | 'expense';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Convert date to ISO string for Prisma
    const payload = { ...req.body, userId };
    if (payload.date) payload.date = new Date(payload.date).toISOString();

    const transaction = await transactionService.createTransaction(payload);
    res.status(201).json({ success: true, data: transaction });
  } catch (err: any) {
    console.error('Transaction error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const typeQuery = req.query.type;
    let type: TransactionType | undefined;
    if (typeQuery === 'income' || typeQuery === 'expense') type = typeQuery;

    const filters: { type?: TransactionType; startDate?: Date; endDate?: Date } = {};
    if (type) filters.type = type;
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

    const transactions = await transactionService.getAllTransactions(userId, filters);
    res.status(200).json({ success: true, data: transactions });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Transaction ID is required' });

    const transaction = await transactionService.getTransactionById(id, userId);
    res.status(200).json({ success: true, data: transaction });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Transaction ID is required' });

    if (req.body.date) req.body.date = new Date(req.body.date).toISOString();

    const updatedTransaction = await transactionService.updateTransaction(id, userId, req.body);
    res.status(200).json({ success: true, data: updatedTransaction });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Transaction ID is required' });

    const result = await transactionService.deleteTransaction(id, userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};