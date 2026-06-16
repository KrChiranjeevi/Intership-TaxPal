import { PrismaClient, type Report, type Transaction } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { parse } from 'json2csv';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface ReportInput {
  userId: string;
  reportType: string;
  period: 'Current Month' | 'Last Month' | 'Year';
  format: 'PDF' | 'CSV';
  filePath?: string;
}

// Helper: Get date range for period
function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now);

  switch (period) {
    case 'Current Month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'Last Month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case 'Year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    default:
      throw new Error('Invalid period');
  }

  return { start, end };
}

// Fetch transactions for user by type & period
async function fetchTransactions(userId: string, type?: 'income' | 'expense', period?: string): Promise<Transaction[]> {
  const where: any = { userId };
  if (type) where.type = type;

  if (period) {
    const { start, end } = getDateRange(period);
    where.date = { gte: start, lte: end };
  }

  return prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
  });
}

async function generateFile(reportType: string, transactions: Transaction[], period: string, format: 'PDF' | 'CSV', id: string): Promise<string> {
  const folder = process.env.VERCEL
    ? path.join('/tmp', 'generated_reports')
    : path.join(process.cwd(), 'generated_reports');
  await fs.ensureDir(folder);

  const fileName = `${reportType}-${period}-${id}.${format.toLowerCase()}`;
  const filePath = path.join(folder, fileName);

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  if (format === 'PDF') {
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).text(`${reportType} (${period})`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('Transactions:', { underline: true });

      transactions.forEach((t) => {
        doc.text(`${t.date.toDateString()} | ${t.type} | ${t.category || '-'} | ${t.amount}`);
      });

      doc.moveDown();

      // Totals based on report type
      if (reportType === 'Income Statement') {
        doc.text(`Total Income: ${totalIncome}`);
      } else if (reportType === 'Expense Report') {
        doc.text(`Total Expense: ${totalExpense}`);
      } else if (reportType === 'Balance Sheet') {
        doc.text(`Total Income: ${totalIncome}`);
        doc.text(`Total Expense: ${totalExpense}`);
        doc.text(`Net Balance: ${netBalance}`);
      }

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });
  } else if (format === 'CSV') {
    const data = transactions.map((t) => ({
      Date: t.date.toISOString(),
      Type: t.type,
      Category: t.category || '-',
      Amount: t.amount,
      Description: t.description,
    }));

    // Append totals based on report type
    if (reportType === 'Income Statement') {
      data.push({ Date: '', Type: '', Category: 'Total Income', Amount: totalIncome, Description: '' });
    } else if (reportType === 'Expense Report') {
      data.push({ Date: '', Type: '', Category: 'Total Expense', Amount: totalExpense, Description: '' });
    } else if (reportType === 'Balance Sheet') {
      data.push({ Date: '', Type: '', Category: 'Total Income', Amount: totalIncome, Description: '' });
      data.push({ Date: '', Type: '', Category: 'Total Expense', Amount: totalExpense, Description: '' });
      data.push({ Date: '', Type: '', Category: 'Net Balance', Amount: netBalance, Description: '' });
    }

    const csv = parse(data);
    await fs.writeFile(filePath, csv);
  }

  return `/generated_reports/${fileName}`;
}


// -------------------------
// SERVICE FUNCTIONS
// -------------------------

export async function createReport(data: ReportInput): Promise<Report> {
  const { userId, reportType, period, format } = data;

  // Validate report type
  const allowedTypes = ['Income Statement', 'Expense Report', 'Balance Sheet'];
  if (!allowedTypes.includes(reportType)) throw new Error('Invalid report type');

  // Determine transaction type filter
  let typeFilter: 'income' | 'expense' | undefined;
  if (reportType === 'Income Statement') typeFilter = 'income';
  if (reportType === 'Expense Report') typeFilter = 'expense';

  // Fetch transactions
  let transactions: Transaction[] = [];
  if (reportType === 'Balance Sheet') {
    const incomes = await fetchTransactions(userId, 'income', period);
    const expenses = await fetchTransactions(userId, 'expense', period);
    transactions = [...incomes, ...expenses].sort((a, b) => b.date.getTime() - a.date.getTime());
  } else {
    transactions = await fetchTransactions(userId, typeFilter, period);
  }

  // Generate file
  const reportId = crypto.randomUUID();
  const filePath = await generateFile(reportType, transactions, period, format, reportId);
  const name = `${reportType} - ${period} (${format})`;

  return prisma.report.create({
    data: {
      userId,
      reportType,
      period,
      format,
      filePath,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      generatedAt: new Date(),
    },
  });
}

export async function getReportsByUserId(userId: string): Promise<Report[]> {
  return prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getReportById(id: string): Promise<Report | null> {
  return prisma.report.findUnique({ where: { id } });
}

export async function deleteReport(id: string): Promise<Report> {
  return prisma.report.delete({ where: { id } });
}

// Update a report
export async function updateReport(
  id: string,
  data: Partial<ReportInput>
): Promise<Report> {
  return prisma.report.update({
    where: { id },
    data,
  });
}
