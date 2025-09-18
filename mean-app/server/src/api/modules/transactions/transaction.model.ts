import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define allowed transaction types
export type TransactionType = "income" | "expense";

// Input type for creating a transaction
export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  category?: string;
  description: string;
  date: Date;
  notes?: string;
  userId: string;
}

// Input type for updating a transaction
export interface UpdateTransactionInput {
  type?: TransactionType;
  amount?: number;
  category?: string;
  description?: string;
  date?: Date;
  notes?: string;
}

// -------------------------
// MODEL FUNCTIONS
// -------------------------

// Create a new transaction
export const createTransaction = async (
  data: CreateTransactionInput
) => {
  return await prisma.transaction.create({
    data,
  });
};

// Fetch all transactions for a user (with optional filters)
export const getAllTransactions = async (
  userId: string,
  filters?: { type?: TransactionType; startDate?: Date; endDate?: Date }
) => {
  const where: any = { userId };

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  return await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });
};

// Fetch a single transaction by ID for a specific user
export const getTransactionById = async (id: string, userId: string) => {
  return await prisma.transaction.findFirst({
    where: { id, userId },
  });
};

// Update a transaction (only by the owner)
export const updateTransaction = async (
  id: string,
  userId: string,
  data: UpdateTransactionInput
) => {
  // Use updateMany to ensure only the owner can update
  const result = await prisma.transaction.updateMany({
    where: { id, userId },
    data,
  });

  if (result.count === 0) {
    throw new Error("Transaction not found or not authorized");
  }

  // Return the updated transaction
  return await prisma.transaction.findFirst({ where: { id, userId } });
};

// Delete a transaction (only by the owner)
export const deleteTransaction = async (id: string, userId: string) => {
  const result = await prisma.transaction.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    throw new Error("Transaction not found or not authorized");
  }

  return { message: "Transaction deleted successfully" };
};
