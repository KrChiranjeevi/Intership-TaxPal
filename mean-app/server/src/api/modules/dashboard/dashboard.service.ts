import { prisma } from "../../../config/prisma.client.js";

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export type DashboardPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface DashboardSummary {
  monthlyIncome: number;
  periodIncome: number;
  monthlyExpenses: number;
  periodExpenses: number;
  netBalance: number;
  estimatedTax: number;
  savingsRate: number;
  totalTransactions: number;
  period: DashboardPeriod;
  periodLabel: string;
}

export interface MonthlyChartPoint {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
}

export interface DashboardTransactionDto {
  id: string;
  name: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}

export async function getDashboardSummary(
  userId: string,
  period: string = "monthly",
  year?: number,
  month?: number
) {
  const now = new Date();
  const currentYear = year && !isNaN(year) ? year : now.getFullYear();
  const currentMonthIndex = month !== undefined && !isNaN(month) ? month - 1 : now.getMonth();

  // Normalize period (default: monthly)
  let validPeriod: DashboardPeriod = 'monthly';
  if (period === 'quarterly' || period === 'yearly') {
    validPeriod = period;
  }

  // 1. Calculate boundaries and label for the selected period
  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;
  let chartMonthIndices: number[] = [];

  if (validPeriod === 'yearly') {
    startDate = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    endDate = new Date(currentYear, 12, 0, 23, 59, 59, 999);
    periodLabel = `${currentYear} (Full Year)`;
    chartMonthIndices = Array.from({ length: 12 }, (_, i) => i);
  } else if (validPeriod === 'quarterly') {
    const quarterIndex = Math.floor(currentMonthIndex / 3); // 0 (Q1), 1 (Q2), 2 (Q3), 3 (Q4)
    const quarterStartMonth = quarterIndex * 3;
    const quarterEndMonth = quarterStartMonth + 2;

    startDate = new Date(currentYear, quarterStartMonth, 1, 0, 0, 0, 0);
    endDate = new Date(currentYear, quarterEndMonth + 1, 0, 23, 59, 59, 999);
    periodLabel = `Q${quarterIndex + 1} ${currentYear} (${MONTH_NAMES[quarterStartMonth]} - ${MONTH_NAMES[quarterEndMonth]})`;
    chartMonthIndices = [quarterStartMonth, quarterStartMonth + 1, quarterEndMonth];
  } else {
    // default: monthly
    startDate = new Date(currentYear, currentMonthIndex, 1, 0, 0, 0, 0);
    endDate = new Date(currentYear, currentMonthIndex + 1, 0, 23, 59, 59, 999);
    periodLabel = `${MONTH_NAMES[currentMonthIndex]} ${currentYear}`;
    chartMonthIndices = Array.from({ length: 12 }, (_, i) => i);
  }

  // 2. Fetch transactions within the selected period (for stats & category breakdown)
  const periodTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'desc' },
  });

  const totalIncome = periodTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpenses = periodTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpenses;
  const estimatedTax = netBalance > 0 ? Number(((totalIncome - totalExpenses) * 0.15).toFixed(2)) : 0;
  const savingsRate = totalIncome > 0
    ? Number(Math.max(0, ((netBalance / totalIncome) * 100)).toFixed(1))
    : 0;

  // 3. Category breakdown for expenses in this selected period
  const categoryMap = new Map<string, number>();
  for (const tx of periodTransactions) {
    if (tx.type === 'expense') {
      const cat = tx.category?.trim() || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(tx.amount || 0));
    }
  }

  const expenseBreakdown: CategoryExpense[] = [];
  categoryMap.forEach((amount, category) => {
    const percentage = totalExpenses > 0
      ? Number(((amount / totalExpenses) * 100).toFixed(1))
      : 0;
    expenseBreakdown.push({
      category,
      amount: Number(amount.toFixed(2)),
      percentage,
    });
  });
  expenseBreakdown.sort((a, b) => b.amount - a.amount);

  // 4. Calculate Income vs Expenses chart data tailored to the period
  // For yearly and monthly, we query the full current year; for quarterly, we query the quarter range
  const chartStart = validPeriod === 'quarterly' ? startDate : new Date(currentYear, 0, 1, 0, 0, 0, 0);
  const chartEnd = validPeriod === 'quarterly' ? endDate : new Date(currentYear, 12, 0, 23, 59, 59, 999);

  const chartTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: chartStart, lte: chartEnd },
    },
    select: {
      type: true,
      amount: true,
      date: true,
    },
  });

  const monthlyIncomeArr = Array(12).fill(0);
  const monthlyExpenseArr = Array(12).fill(0);

  for (const tx of chartTransactions) {
    const txDate = new Date(tx.date);
    const m = txDate.getMonth();
    if (m >= 0 && m < 12) {
      if (tx.type === 'income') {
        monthlyIncomeArr[m] += Number(tx.amount || 0);
      } else if (tx.type === 'expense') {
        monthlyExpenseArr[m] += Number(tx.amount || 0);
      }
    }
  }

  const incomeVsExpenses: MonthlyChartPoint[] = chartMonthIndices.map((monthIndex) => ({
    month: MONTH_NAMES[monthIndex] ?? `M${monthIndex + 1}`,
    income: Number(monthlyIncomeArr[monthIndex]?.toFixed(2) ?? 0),
    expense: Number(monthlyExpenseArr[monthIndex]?.toFixed(2) ?? 0),
  }));

  // 5. Fetch recent transactions for the user
  const recentRawTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 8,
  });

  const recentTransactions: DashboardTransactionDto[] = recentRawTransactions.map(t => ({
    id: t.id,
    name: t.description || 'Transaction',
    description: t.description || '',
    category: t.category || 'General',
    amount: Number(t.amount || 0),
    type: t.type === 'income' ? 'income' : 'expense',
    date: t.date.toISOString(),
  }));

  // 6. Counts to determine global empty state vs period empty state
  const allTimeTotalTransactions = await prisma.transaction.count({
    where: { userId },
  });

  const periodTotalTransactions = periodTransactions.length;

  return {
    summary: {
      monthlyIncome: Number(totalIncome.toFixed(2)),
      periodIncome: Number(totalIncome.toFixed(2)),
      monthlyExpenses: Number(totalExpenses.toFixed(2)),
      periodExpenses: Number(totalExpenses.toFixed(2)),
      netBalance: Number(netBalance.toFixed(2)),
      estimatedTax: Number(estimatedTax.toFixed(2)),
      savingsRate,
      totalTransactions: periodTotalTransactions,
      period: validPeriod,
      periodLabel,
    },
    period: validPeriod,
    periodLabel,
    incomeVsExpenses,
    expenseBreakdown,
    recentTransactions,
    periodTotalTransactions,
    allTimeTotalTransactions,

    // Backwards-compatible fields
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netBalance: Number(netBalance.toFixed(2)),
    estimatedTax: Number(estimatedTax.toFixed(2)),
    savingsRate: `${savingsRate}%`,
  };
}