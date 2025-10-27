export interface Report {
  id: string;
  userId: string;
  period: string;        // e.g., 'Current Month', 'Quarter', 'Year'
  reportType: string;    // e.g., 'Income Statement', 'Expense Report', 'Balance Sheet'
  filePath: string;      // File path or URL for download
  format: string;        // 'PDF' or 'CSV'
  createdAt: Date;
  updatedAt: Date;
}
