import {
  createTransaction as createTransactionModel,
  getAllTransactions as getAllTransactionsModel,
  getTransactionById as getTransactionByIdModel,
  updateTransaction as updateTransactionModel,
  deleteTransaction as deleteTransactionModel,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionType,
} from "./transaction.model.js";

// -------------------------
// SERVICE FUNCTIONS
// -------------------------

// Create a new transaction with basic validation
export const createTransaction = async (data: CreateTransactionInput) => {
  if (!data.type || !["income", "expense"].includes(data.type)) {
    throw new Error("Invalid transaction type");
  }
  if (!data.amount || data.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  if (!data.description) {
    throw new Error("Description is required");
  }
  return await createTransactionModel(data);
};

// Fetch all transactions for a user, with optional filters

export const getAllTransactions = async (
  userId: string,
  filters?: { type?: TransactionType; startDate?: Date; endDate?: Date }
) => {
  return await getAllTransactionsModel(userId, filters);
};

// Fetch a single transaction by ID
export const getTransactionById = async (id: string, userId: string) => {
  const transaction = await getTransactionByIdModel(id, userId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  return transaction;
};

// Update a transaction
export const updateTransaction = async (
  id: string,
  userId: string,
  data: UpdateTransactionInput
) => {
  if (data.type && !["income", "expense"].includes(data.type)) {
    throw new Error("Invalid transaction type");
  }
  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  const updatedTransaction = await updateTransactionModel(id, userId, data);
  return updatedTransaction;
};

// Delete a transaction
export const deleteTransaction = async (id: string, userId: string) => {
  return await deleteTransactionModel(id, userId);
};