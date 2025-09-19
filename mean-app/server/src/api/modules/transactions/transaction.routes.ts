// src/api/modules/transactions/transaction.routes.ts
import { Router } from "express";
import * as transactionController from "./transaction.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes are protected with authMiddleware
router.use(authMiddleware);

// Create a new transaction
router.post("/", transactionController.createTransaction);

// Get all transactions (with optional filters)
router.get("/", transactionController.getAllTransactions);

// Get a single transaction by ID
router.get("/:id", transactionController.getTransactionById);

// Update a transaction by ID
router.put("/:id", transactionController.updateTransaction);

// Delete a transaction by ID
router.delete("/:id", transactionController.deleteTransaction);

export default router;
