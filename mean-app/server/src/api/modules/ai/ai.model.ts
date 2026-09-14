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

export interface AggregatedFinancialMetrics {
  period: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  topExpenseCategory: string;
  topExpenseAmount: number;
  budgetUsage: number;
  overBudgetCategories: number;
}

export interface FinancialSummaryAiResponse {
  summary: string;
  insights: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface FinancialSummaryResponse {
  success: boolean;
  data: FinancialSummaryAiResponse;
  fallback?: boolean | undefined;
  message?: string | undefined;
}

export interface TaxSuggestionInput {
  income: number;
  region?: string | undefined;
  state?: string | undefined;
  quarter?: string | undefined;
  filingStatus?: string | undefined;
  businessExpenses?: number | undefined;
  retirement?: number | undefined;
  healthInsurance?: number | undefined;
  homeOffice?: number | undefined;
  additionalDeductions?: number | undefined;
}

export interface TaxSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface TaxSuggestionsResponse {
  success: boolean;
  suggestions: TaxSuggestion[];
  fallback?: boolean | undefined;
  message?: string | undefined;
}
