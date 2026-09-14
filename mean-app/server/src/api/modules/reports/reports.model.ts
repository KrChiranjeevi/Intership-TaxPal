export interface Report {
  id: string;
  userId: string;
  period: string;        // e.g., 'Current Month', 'Last Month', 'Year', 'Custom'
  reportType: string;    // e.g., 'Financial Report', 'Income Statement', 'Expense Report', 'Balance Sheet'
  filePath: string;      // File path or URL for download
  format: string;        // 'PDF' or 'CSV'
  createdAt: Date;
  updatedAt: Date;
  name?: string | null;
  summary?: ReportSummary;
}

export interface ReportFilters {
  period?: 'Current Month' | 'Last Month' | 'Quarter' | 'Year' | 'Custom' | string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  type?: 'all' | 'income' | 'expense' | undefined;
  category?: string | undefined;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  transactionCount: number;
  largestExpense: number;
  topSpendingCategory: string;
}

export interface ReportTransaction {
  id: string;
  date: Date;
  description: string;
  category: string;
  type: string;
  amount: number;
}

export interface ReportPreviewResponse {
  summary: ReportSummary;
  transactions: ReportTransaction[];
}

export interface CreateReportInput {
  userId: string;
  reportType?: string | undefined;
  period?: string | undefined;
  format: 'PDF' | 'CSV';
  startDate?: string | undefined;
  endDate?: string | undefined;
  type?: 'all' | 'income' | 'expense' | undefined;
  category?: string | undefined;
  filePath?: string | undefined;
}
