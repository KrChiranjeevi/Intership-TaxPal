// // import type { Response } from 'express';
// import type { Request, Response } from 'express';
// import type { AuthRequest } from '../../middlewares/auth.middleware.js';
// import * as transactionService from './transaction.service.js';
// import { PrismaClient } from '@prisma/client';


// type TransactionType = 'income' | 'expense';

// export const createTransaction = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

//     // Convert date to ISO string for Prisma
//     const payload = { ...req.body, userId };
//     if (payload.date) payload.date = new Date(payload.date).toISOString();

//     const transaction = await transactionService.createTransaction(payload);
//     res.status(201).json({ success: true, data: transaction });
//   } catch (err: any) {
//     console.error('Transaction error:', err);
//     res.status(400).json({ success: false, message: err.message });
//   }
// };


// const prisma = new PrismaClient();

// export const getTransactions = async (req: Request, res: Response) => {
//   try {
//     // In a real app, you would get the user ID from the auth token
//     const userId = "your_user_id"; // Replace with actual user ID from auth

//     const transactions = await prisma.transaction.findMany({
//       where: { userId: userId },
//       orderBy: { date: 'desc' }
//     });

//     res.status(200).json({ success: true, data: transactions });
//   } catch (error) {
//     console.error("Error fetching transactions:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };



// export const getAllTransactions = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

//     const typeQuery = req.query.type;
//     let type: TransactionType | undefined;
//     if (typeQuery === 'income' || typeQuery === 'expense') type = typeQuery;

//     const filters: { type?: TransactionType; startDate?: Date; endDate?: Date } = {};
//     if (type) filters.type = type;
//     if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
//     if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

//     const transactions = await transactionService.getAllTransactions(userId, filters);
//     res.status(200).json({ success: true, data: transactions });
//   } catch (err: any) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// export const getTransactionById = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

//     const id = req.params.id;
//     if (!id) return res.status(400).json({ success: false, message: 'Transaction ID is required' });

//     const transaction = await transactionService.getTransactionById(id, userId);
//     res.status(200).json({ success: true, data: transaction });
//   } catch (err: any) {
//     res.status(404).json({ success: false, message: err.message });
//   }
// };

// export const updateTransaction = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

//     const id = req.params.id;
//     if (!id) return res.status(400).json({ success: false, message: 'Transaction ID is required' });

//     if (req.body.date) req.body.date = new Date(req.body.date).toISOString();

//     const updatedTransaction = await transactionService.updateTransaction(id, userId, req.body);
//     res.status(200).json({ success: true, data: updatedTransaction });
//   } catch (err: any) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// export const deleteTransaction = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

//     const id = req.params.id;
//     if (!id) return res.status(400).json({ success: false, message: 'Transaction ID is required' });

//     const result = await transactionService.deleteTransaction(id, userId);
//     res.status(200).json({ success: true, message: result.message });
//   } catch (err: any) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };


import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as transactionService from './transaction.service.js';

const prisma = new PrismaClient();

type AuthRequest = Request & { user?: { id: string } };

export const getTransactionsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const transactions = await transactionService.getAllTransactions(userId);
    res.status(200).json({ success: true, data: transactions });
  } catch (err: any) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addTransactionController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const transaction = await prisma.transaction.create({ data: { ...req.body, userId } });
    res.status(201).json({ success: true, data: transaction });
  } catch (err: any) {
    console.error('Error adding transaction:', err);
    res.status(400).json({ success: false, message: (err as Error).message });
  }
};

export const createTransactionController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const transaction = await transactionService.createTransaction({ ...req.body, userId });
    res.status(201).json({ success: true, data: transaction });
  } catch (err: any) {
    console.error('Error adding transaction:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};





// // server/src/api/modules/transactions/transaction.controller.ts

// import type { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();
// type AuthRequest = Request & { user?: { id: string } };

// export const getTransactionsController = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }
//     const transactions = await prisma.transaction.findMany({
//       where: { userId: userId },
//       orderBy: { date: 'desc' }
//     });
//     res.status(200).json({ success: true, data: transactions });
//   } catch (err: any) {
//     console.error('Error fetching transactions:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// export const addTransactionController = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }
//     const transaction = await prisma.transaction.create({ data: { ...req.body, userId } });
//     res.status(201).json({ success: true, data: transaction });
//   } catch (err: any) {
//     console.error('Error adding transaction:', err);
//     res.status(400).json({ success: false, message: (err as Error).message });
//   }
// };