import {
  createTransaction as createTransactionModel,
  getAllTransactions as getAllTransactionsModel,
  getTransactionById as getTransactionByIdModel,
  updateTransaction as updateTransactionModel,
  deleteTransaction as deleteTransactionModel,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionType,
  type TransactionFilters,
} from "./transaction.model.js";

// -------------------------
// SERVICE FUNCTIONS
// -------------------------

// Create a new transaction with validation
export const createTransaction = async (data: CreateTransactionInput) => {
  if (!data.type || !["income", "expense"].includes(data.type.toLowerCase())) {
    throw new Error("Invalid transaction type. Must be 'income' or 'expense'");
  }
  if (data.amount === undefined || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    throw new Error("Amount must be a positive number greater than 0");
  }
  if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
    throw new Error("Description is required");
  }
  if (data.date && isNaN(new Date(data.date).getTime())) {
    throw new Error("Invalid date provided");
  }

  const normalized = {
    ...data,
    type: data.type.toLowerCase() as TransactionType,
    amount: Number(Number(data.amount).toFixed(2)),
    description: data.description.trim(),
    category: data.category?.trim() || 'General',
    date: data.date ? new Date(data.date) : new Date(),
  };

  return await createTransactionModel(normalized);
};

// Fetch all transactions for a user, with optional filters and pagination
export const getAllTransactions = async (
  userId: string,
  filters?: TransactionFilters
) => {
  return await getAllTransactionsModel(userId, filters);
};

// Fetch a single transaction by ID
export const getTransactionById = async (id: string, userId: string) => {
  const transaction = await getTransactionByIdModel(id, userId);
  if (!transaction) {
    throw new Error("Transaction not found or not authorized");
  }
  return transaction;
};

// Update a transaction with validation
export const updateTransaction = async (
  id: string,
  userId: string,
  data: UpdateTransactionInput
) => {
  if (data.type && !["income", "expense"].includes(data.type.toLowerCase())) {
    throw new Error("Invalid transaction type. Must be 'income' or 'expense'");
  }
  if (data.amount !== undefined && (isNaN(Number(data.amount)) || Number(data.amount) <= 0)) {
    throw new Error("Amount must be a positive number greater than 0");
  }
  if (data.description !== undefined && (!data.description || !data.description.trim())) {
    throw new Error("Description cannot be empty");
  }
  if (data.date && isNaN(new Date(data.date).getTime())) {
    throw new Error("Invalid date provided");
  }

  const sanitized: UpdateTransactionInput = { ...data };
  if (sanitized.type) sanitized.type = sanitized.type.toLowerCase() as TransactionType;
  if (sanitized.amount !== undefined) sanitized.amount = Number(Number(sanitized.amount).toFixed(2));
  if (sanitized.description !== undefined) sanitized.description = sanitized.description.trim();
  if (sanitized.category !== undefined) sanitized.category = sanitized.category?.trim() || 'General';
  if (sanitized.date) sanitized.date = new Date(sanitized.date);

  return await updateTransactionModel(id, userId, sanitized);
};

// Delete a transaction
export const deleteTransaction = async (id: string, userId: string) => {
  return await deleteTransactionModel(id, userId);
};