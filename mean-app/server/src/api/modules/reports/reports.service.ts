import { type Report, type Transaction } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { parse } from 'json2csv';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../../../config/prisma.client.js';
import type {
  ReportFilters,
  ReportSummary,
  ReportTransaction,
  ReportPreviewResponse,
  CreateReportInput
} from './reports.model.js';

/**
 * Validates and resolves date range from period or explicit start/end dates.
 */
export function validateAndResolveDateRange(
  period?: string,
  startDate?: string,
  endDate?: string
): { start: Date; end: Date; label: string } {
  const now = new Date();

  // 1. If custom start/end dates provided or period is 'Custom'
  if (startDate || endDate || period === 'Custom') {
    if (!startDate || !endDate) {
      throw new Error('Both start date and end date are required for custom date range');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Please provide valid dates (YYYY-MM-DD)');
    }

    // Normalize start to beginning of day and end to end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      throw new Error('Start date must be before or equal to end date');
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    return { start, end, label: `${startStr} to ${endStr}` };
  }

  // 2. Named periods
  let start: Date;
  let end: Date = new Date(now);

  const selectedPeriod = period || 'Current Month';

  switch (selectedPeriod) {
    case 'Current Month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case 'Last Month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;

    case 'Quarter': {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
      break;
    }

    case 'Year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      throw new Error(`Invalid report period: ${selectedPeriod}`);
  }

  return { start, end, label: selectedPeriod };
}

/**
 * Compute report summary metrics from an array of transactions.
 */
export function calculateReportSummary(transactions: Transaction[]): ReportSummary {
  let totalIncome = 0;
  let totalExpenses = 0;
  let largestExpense = 0;
  const categorySpendingMap: Record<string, number> = {};

  for (const t of transactions) {
    const amount = Number(t.amount) || 0;
    const type = t.type?.toLowerCase();

    if (type === 'income') {
      totalIncome += amount;
    } else if (type === 'expense') {
      totalExpenses += amount;
      if (amount > largestExpense) {
        largestExpense = amount;
      }
      const cat = (t.category || 'Uncategorized').trim();
      categorySpendingMap[cat] = (categorySpendingMap[cat] || 0) + amount;
    }
  }

  // Find top spending category
  let topSpendingCategory = 'N/A';
  let maxSpent = 0;
  for (const [cat, spent] of Object.entries(categorySpendingMap)) {
    if (spent > maxSpent) {
      maxSpent = spent;
      topSpendingCategory = cat;
    }
  }

  const netSavings = Math.round((totalIncome - totalExpenses) * 100) / 100;

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netSavings,
    transactionCount: transactions.length,
    largestExpense: Math.round(largestExpense * 100) / 100,
    topSpendingCategory
  };
}

/**
 * Fetch filtered transactions directly from PostgreSQL using Prisma.
 */
export async function fetchFilteredTransactions(
  userId: string,
  filters: ReportFilters
): Promise<Transaction[]> {
  const where: any = { userId };

  // Date filtering
  const { start, end } = validateAndResolveDateRange(
    filters.period,
    filters.startDate,
    filters.endDate
  );
  where.date = { gte: start, lte: end };

  // Transaction type filtering
  if (filters.type && filters.type !== 'all') {
    where.type = filters.type.toLowerCase();
  }

  // Category filtering
  if (filters.category && filters.category.trim() && filters.category.toLowerCase() !== 'all') {
    where.category = {
      contains: filters.category.trim(),
      mode: 'insensitive'
    };
  }

  return prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' }
  });
}

/**
 * Get real-time report summary and filtered preview records for UI preview.
 */
export async function getReportPreview(
  userId: string,
  filters: ReportFilters
): Promise<ReportPreviewResponse> {
  const transactions = await fetchFilteredTransactions(userId, filters);
  const summary = calculateReportSummary(transactions);

  const mappedTransactions: ReportTransaction[] = transactions.map((t) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    category: t.category || 'Uncategorized',
    type: t.type,
    amount: t.amount
  }));

  return {
    summary,
    transactions: mappedTransactions
  };
}

/**
 * Generates an improved, clean PDF or CSV export file on the server.
 */
async function generateFile(
  reportType: string,
  transactions: Transaction[],
  periodLabel: string,
  format: 'PDF' | 'CSV',
  id: string,
  summary: ReportSummary
): Promise<string> {
  const folder = path.join(process.cwd(), 'generated_reports');
  await fs.ensureDir(folder);

  const sanitizedLabel = periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `taxpal-${sanitizedLabel}-${id}.${format.toLowerCase()}`;
  const filePath = path.join(folder, fileName);

  if (format === 'PDF') {
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- Header Section ---
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#1e293b').text('TaxPal', 40, 40);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#334155').text('Financial Report', 40, 68);
      doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Report Period: ${periodLabel}`, 40, 88);
      doc.text(`Generated: ${new Date().toUTCString()}`, 40, 102);

      // Divider line
      doc.moveTo(40, 120).lineTo(555, 120).strokeColor('#cbd5e1').lineWidth(1).stroke();

      // --- Summary Section Box ---
      doc.rect(40, 132, 515, 80).fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a');
      doc.text('FINANCIAL SUMMARY', 55, 142);

      doc.fontSize(10).font('Helvetica').fillColor('#475569');
      doc.text(`Total Income: $${summary.totalIncome.toFixed(2)}`, 55, 160);
      doc.text(`Total Expenses: $${summary.totalExpenses.toFixed(2)}`, 55, 176);
      doc.text(`Net Savings: $${summary.netSavings.toFixed(2)}`, 55, 192);

      doc.text(`Transactions: ${summary.transactionCount}`, 260, 160);
      doc.text(`Largest Expense: $${summary.largestExpense.toFixed(2)}`, 260, 176);
      doc.text(`Top Spending Category: ${summary.topSpendingCategory}`, 260, 192);

      // --- Transaction Table Header ---
      let y = 230;
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('Transaction Details', 40, y);
      y += 18;

      // Table Column Headers
      doc.rect(40, y, 515, 20).fill('#e2e8f0');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b');
      doc.text('Date', 45, y + 5, { width: 75 });
      doc.text('Description', 125, y + 5, { width: 170 });
      doc.text('Category', 300, y + 5, { width: 100 });
      doc.text('Type', 405, y + 5, { width: 60 });
      doc.text('Amount', 475, y + 5, { width: 75, align: 'right' });
      y += 22;

      // Table Rows
      doc.font('Helvetica').fontSize(9);

      if (transactions.length === 0) {
        doc.fillColor('#64748b').text('No transactions found for the selected period.', 45, y + 10);
      } else {
        for (let i = 0; i < transactions.length; i++) {
          const t = transactions[i];
          if (!t) continue;

          // Check for page break
          if (y > 750) {
            doc.addPage();
            y = 40;
            doc.rect(40, y, 515, 20).fill('#e2e8f0');
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b');
            doc.text('Date', 45, y + 5, { width: 75 });
            doc.text('Description', 125, y + 5, { width: 170 });
            doc.text('Category', 300, y + 5, { width: 100 });
            doc.text('Type', 405, y + 5, { width: 60 });
            doc.text('Amount', 475, y + 5, { width: 75, align: 'right' });
            y += 22;
            doc.font('Helvetica').fontSize(9);
          }

          // Alternating row background
          if (i % 2 === 1) {
            doc.rect(40, y - 2, 515, 18).fill('#f8fafc');
          }

          const dateStr = t.date ? (new Date(t.date).toISOString().split('T')[0] ?? '-') : '-';
          const desc = (t.description || '-').slice(0, 30);
          const category = (t.category || '-').slice(0, 18);
          const type = (t.type || '-').toUpperCase();
          const amountStr = `$${Number(t.amount).toFixed(2)}`;

          doc.fillColor('#334155').text(dateStr, 45, y, { width: 75 });
          doc.fillColor('#0f172a').text(desc, 125, y, { width: 170, ellipsis: true });
          doc.fillColor('#475569').text(category, 300, y, { width: 100, ellipsis: true });

          if (t.type?.toLowerCase() === 'income') {
            doc.fillColor('#16a34a').text(type, 405, y, { width: 60 });
            doc.fillColor('#16a34a').text(`+${amountStr}`, 475, y, { width: 75, align: 'right' });
          } else {
            doc.fillColor('#dc2626').text(type, 405, y, { width: 60 });
            doc.fillColor('#dc2626').text(`-${amountStr}`, 475, y, { width: 75, align: 'right' });
          }

          y += 18;
        }
      }

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text(
        'Generated by TaxPal Personal Finance Management • Confidentially Prepared for Account Holder',
        40,
        785,
        { align: 'center', width: 515 }
      );

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });
  } else if (format === 'CSV') {
    // Clean CSV format with columns: Date, Description, Category, Type, Amount
    const data: Array<{ Date: string; Description: string; Category: string; Type: string; Amount: string | number }> =
      transactions.map((t) => ({
        Date: t.date ? (new Date(t.date).toISOString().split('T')[0] ?? '') : '',
        Description: t.description || '',
        Category: t.category || 'Uncategorized',
        Type: (t.type || '').toUpperCase(),
        Amount: Number(t.amount).toFixed(2)
      }));

    // Append summary footer rows
    data.push(
      { Date: '', Description: '--- SUMMARY ---', Category: '', Type: '', Amount: '' },
      { Date: '', Description: 'Total Income', Category: '', Type: '', Amount: summary.totalIncome.toFixed(2) },
      { Date: '', Description: 'Total Expenses', Category: '', Type: '', Amount: summary.totalExpenses.toFixed(2) },
      { Date: '', Description: 'Net Savings', Category: '', Type: '', Amount: summary.netSavings.toFixed(2) },
      { Date: '', Description: 'Transaction Count', Category: '', Type: '', Amount: summary.transactionCount },
      { Date: '', Description: 'Largest Expense', Category: '', Type: '', Amount: summary.largestExpense.toFixed(2) },
      { Date: '', Description: 'Top Spending Category', Category: summary.topSpendingCategory, Type: '', Amount: '' }
    );

    const csv = parse(data, { fields: ['Date', 'Description', 'Category', 'Type', 'Amount'] });
    await fs.writeFile(filePath, csv);
  }

  return `/generated_reports/${fileName}`;
}

/**
 * Creates and persists a report record with generated PDF or CSV file.
 */
export async function createReport(data: CreateReportInput): Promise<Report & { summary: ReportSummary }> {
  const { userId, reportType = 'Financial Report', period = 'Current Month', format } = data;

  if (format !== 'PDF' && format !== 'CSV') {
    throw new Error('Format must be either PDF or CSV');
  }

  // Fetch transactions based on filter parameters
  const transactions = await fetchFilteredTransactions(userId, {
    period,
    startDate: data.startDate,
    endDate: data.endDate,
    type: data.type,
    category: data.category
  });

  const { label } = validateAndResolveDateRange(period, data.startDate, data.endDate);
  const summary = calculateReportSummary(transactions);

  // Generate physical file on server
  const reportId = crypto.randomUUID();
  const filePath = await generateFile(reportType, transactions, label, format, reportId, summary);
  const name = `TaxPal ${reportType} - ${label} (${format})`;

  const createdReport = await prisma.report.create({
    data: {
      userId,
      reportType,
      period: label,
      format,
      filePath,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      generatedAt: new Date()
    }
  });

  return {
    ...createdReport,
    summary
  };
}

export async function getReportsByUserId(userId: string): Promise<Report[]> {
  return prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getReportById(id: string, userId: string): Promise<Report | null> {
  return prisma.report.findFirst({ where: { id, userId } });
}

export async function deleteReport(id: string, userId: string): Promise<Report | null> {
  const existing = await prisma.report.findFirst({ where: { id, userId } });
  if (!existing) return null;

  // Clean up physical file from disk safely if it exists
  try {
    if (existing.filePath) {
      const sanitizedRelPath = existing.filePath.replace(/^\/?generated_reports\/?/, '');
      const fullPath = path.join(process.cwd(), 'generated_reports', sanitizedRelPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (fileErr) {
    console.error('Failed to remove report file from disk:', fileErr);
  }

  return prisma.report.delete({ where: { id } });
}

export async function updateReport(
  id: string,
  userId: string,
  data: Partial<CreateReportInput>
): Promise<Report | null> {
  const existing = await prisma.report.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const updateData: { reportType?: string; period?: string; format?: string } = {};
  if (data.reportType !== undefined) updateData.reportType = data.reportType;
  if (data.period !== undefined) updateData.period = data.period;
  if (data.format !== undefined) updateData.format = data.format;

  return prisma.report.update({
    where: { id },
    data: updateData
  });
}
