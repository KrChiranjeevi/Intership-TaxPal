// server/src/api/modules/FinancialReport/FinancialReport.service.ts

import { PrismaClient } from "@prisma/client";
import type { Transaction } from "@prisma/client"; 
import { Parser } from "json2csv";
const prisma = new PrismaClient();

// Report data structure
interface ReportData {
  description: string;
  category: string;
  amount: number;
  date: Date;
  type: "income" | "expense";
}


// This is the core function that generates the report data
export async function generateReportData(
  userId: string,
  reportType: "Income Statement" | "Spending Breakdown",
  period: "Current Month" | "Last Quarter" | "Full Year"
) {
  // Define date range based on period (Simplified for demonstration)
  const endDate = new Date();
  const startDate = new Date();
  
  if (period === "Current Month") {
    startDate.setDate(1);
  }
  // You can add more logic here for 'Last Quarter' or 'Full Year'

  // Fetch transactions from the database using Prisma
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Generate a simple summary report
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return {
    reportName: 'Income Statement Summary',
    period,
    totalIncome,
    totalExpenses,
    netIncome: totalIncome - totalExpenses,
    details: transactions, // Include detailed transactions in the report
  };
}

// Function to export report data to CSV format
export async function exportToCSV(reportData: any) {
  const fields = ["reportName", "period", "totalIncome", "totalExpenses", "netIncome"];
  const parser = new Parser({ fields });
  return parser.parse(reportData);
}

