// budget.model.ts

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  month: Date;
  description?: string | null | undefined;
  userId: string;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface BudgetSpendingDetails {
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

export interface CalculatedBudget extends Budget {
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

export interface CreateBudgetInput {
  category: string;
  amount: number;
  month: Date | string;
  description?: string | null | undefined;
  userId: string;
}

export interface UpdateBudgetInput {
  category?: string | undefined;
  amount?: number | undefined;
  month?: Date | string | undefined;
  description?: string | null | undefined;
}