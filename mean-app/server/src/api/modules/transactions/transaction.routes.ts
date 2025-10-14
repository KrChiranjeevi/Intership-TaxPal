// // src/api/modules/transactions/transaction.routes.ts
// import { Router } from "express";
// import * as transactionController from "./transaction.controller.js";
// import { authMiddleware } from "../../middlewares/auth.middleware.js";
// import { getTransactions } from "./transaction.controller.js"; // Note the .js extension
// import { createTransaction, getAllTransactions, getTransactionById, updateTransaction, deleteTransaction } from "./transaction.controller.js";


// const router = Router();

// // All routes are protected with authMiddleware
// router.use(authMiddleware);

// // Route to get all transactions
// router.get("/", getTransactions);


// // Create a new transaction
// router.post("/", transactionController.createTransaction);

// // Get all transactions (with optional filters)
// router.get("/", transactionController.getAllTransactions);

// // Get a single transaction by ID
// router.get("/:id", transactionController.getTransactionById);

// // Update a transaction by ID
// router.put("/:id", transactionController.updateTransaction);

// // Delete a transaction by ID
// router.delete("/:id", transactionController.deleteTransaction);

// export default router;


import { Router } from "express";
import { getTransactionsController, createTransactionController } from "./transaction.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes for transactions should be protected
router.use(authMiddleware);

// GET /api/transactions - Get all transactions for the logged-in user
router.get("/", getTransactionsController);

// POST /api/transactions - Create a new transaction
router.post("/", createTransactionController);

export default router;