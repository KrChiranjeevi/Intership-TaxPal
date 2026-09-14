import { prisma } from "../../../config/prisma.client.js";

// Define allowed transaction types
export type TransactionType = "income" | "expense";

// Input type for creating a transaction
export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  category?: string | undefined;
  description: string;
  date: Date;
  notes?: string | undefined;
  userId: string;
}

// Input type for updating a transaction
export interface UpdateTransactionInput {
  type?: TransactionType | undefined;
  amount?: number | undefined;
  category?: string | undefined;
  description?: string | undefined;
  date?: Date | undefined;
  notes?: string | undefined;
}

export interface TransactionFilters {
  search?: string | undefined;
  type?: TransactionType | undefined;
  category?: string | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface PaginatedTransactionsResult {
  transactions: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
  };
}

// -------------------------
// MODEL FUNCTIONS
// -------------------------

// Create a new transaction
export const createTransaction = async (
  data: CreateTransactionInput
) => {
  const createData: any = {
    type: data.type,
    amount: data.amount,
    description: data.description,
    date: data.date,
    userId: data.userId,
  };
  if (data.category !== undefined) createData.category = data.category;
  if (data.notes !== undefined) createData.notes = data.notes;

  return await prisma.transaction.create({
    data: createData,
  });
};

// Fetch transactions for a user with search, filter, pagination, and summary
export const getAllTransactions = async (
  userId: string,
  filters?: TransactionFilters
): Promise<PaginatedTransactionsResult> => {
  const where: any = { userId };

  // Search filter (case-insensitive across description and category)
  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { description: { contains: term, mode: "insensitive" } },
      { category: { contains: term, mode: "insensitive" } },
    ];
  }

  // Type filter
  if (filters?.type && (filters.type === "income" || filters.type === "expense")) {
    where.type = filters.type;
  }

  // Category filter
  if (filters?.category && filters.category.trim() && filters.category.toLowerCase() !== "all") {
    where.category = { equals: filters.category.trim(), mode: "insensitive" };
  }

  // Date range filter
  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  // Total matching records count
  const total = await prisma.transaction.count({ where });

  // Pagination parameters
  const page = Math.max(1, filters?.page || 1);
  const limit = Math.min(50, Math.max(1, filters?.limit || 10));
  const skip = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit) || 1;

  // Retrieve paginated transactions
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    skip,
    take: limit,
  });

  // Calculate summary metrics across the filtered dataset using database aggregation
  const summaryAgg = await prisma.transaction.groupBy({
    by: ["type"],
    where,
    _sum: { amount: true },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  for (const row of summaryAgg) {
    if (row.type === "income") {
      totalIncome = Number(row._sum.amount || 0);
    } else if (row.type === "expense") {
      totalExpense = Number(row._sum.amount || 0);
    }
  }
  const net = totalIncome - totalExpense;

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    summary: {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      net: Number(net.toFixed(2)),
    },
  };
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
  // First verify the transaction exists and belongs to this user
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Transaction not found or not authorized");
  }

  // Perform the update
  const updateData: any = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return await prisma.transaction.update({
    where: { id },
    data: updateData,
  });
};

// Delete a transaction (only by the owner)
export const deleteTransaction = async (id: string, userId: string) => {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Transaction not found or not authorized");
  }

  await prisma.transaction.delete({
    where: { id },
  });

  return { message: "Transaction deleted successfully" };
};

