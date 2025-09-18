// src/api/modules/transactions/transaction.controller.ts
import type { Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import * as transactionService from "./transaction.service.js";

// Define TransactionType locally (should match model)
type TransactionType = "income" | "expense";

// -------------------------
// CONTROLLER FUNCTIONS
// -------------------------

// Create a new transaction
export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const transaction = await transactionService.createTransaction({
      ...req.body,
      userId,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all transactions (with optional filters)
export const getAllTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Validate and cast type query
    const typeQuery = req.query.type;
    let type: TransactionType | undefined;
    if (typeQuery === "income" || typeQuery === "expense") {
      type = typeQuery;
    }

    // Build filters object conditionally to satisfy exactOptionalPropertyTypes
    const filters: {
      type?: TransactionType;
      startDate?: Date;
      endDate?: Date;
    } = {};

    if (type) filters.type = type;
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

    const transactions = await transactionService.getAllTransactions(userId, filters);
    res.status(200).json({ success: true, data: transactions });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get a single transaction by ID
export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "Transaction ID is required" });
    const transaction = await transactionService.getTransactionById(id, userId);

    res.status(200).json({ success: true, data: transaction });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// Update a transaction
export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "Transaction ID is required" });

    const updatedTransaction = await transactionService.updateTransaction(
      id,
      userId,
      req.body
    );

    res.status(200).json({ success: true, data: updatedTransaction });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete a transaction
export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "Transaction ID is required" });
    const result = await transactionService.deleteTransaction(id, userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
