// src/api/modules/ai/ai.model.ts

export const DEFAULT_ALLOWED_CATEGORIES: string[] = [
  'Food',
  'Rent',
  'Transport',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Salary',
  'Freelance',
  'Investments',
  'Other'
];

export interface CategorizeTransactionRequest {
  description: string;
  amount?: number | undefined;
  type?: 'expense' | 'income' | undefined;
}

export interface CategorizeTransactionResponse {
  success: boolean;
  category: string;
  confidence: number;
  message?: string | undefined;
  fallback?: boolean | undefined;
}

export interface AiModelResponse {
  category: string;
  confidence: number;
}
