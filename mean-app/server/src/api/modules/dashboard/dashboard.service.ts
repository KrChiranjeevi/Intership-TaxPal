import { prisma } from "../../../config/prisma.client.js";

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export interface DashboardSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  netBalance: number;
  estimatedTax: number;
  savingsRate: number;
  totalTransactions: number;
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

  // 1. Calculate boundaries for the current selected month / period
  let startDate: Date;
  let endDate: Date;

  if (period === "daily") {
    startDate = new Date(currentYear, currentMonthIndex, now.getDate(), 0, 0, 0, 0);
    endDate = new Date(currentYear, currentMonthIndex, now.getDate(), 23, 59, 59, 999);
  } else if (period === "weekly") {
    const day = now.getDay();
    startDate = new Date(now);
    startDate.setDate(now.getDate() - day);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // default: monthly
    startDate = new Date(currentYear, currentMonthIndex, 1, 0, 0, 0, 0);
    endDate = new Date(currentYear, currentMonthIndex + 1, 0, 23, 59, 59, 999);
  }

  // 2. Fetch transactions for the current period (for cards & category breakdown)
  const currentPeriodTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'desc' },
  });

  const totalIncome = currentPeriodTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpenses = currentPeriodTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpenses;
  const estimatedTax = netBalance > 0 ? Number(((totalIncome - totalExpenses) * 0.15).toFixed(2)) : 0;
  const savingsRate = totalIncome > 0
    ? Number(Math.max(0, ((netBalance / totalIncome) * 100)).toFixed(1))
    : 0;

  // 3. Category breakdown for expenses in this period
  const categoryMap = new Map<string, number>();
  for (const tx of currentPeriodTransactions) {
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
  // Sort category breakdown descending by amount
  expenseBreakdown.sort((a, b) => b.amount - a.amount);

  // 4. Calculate 12-month Income vs Expenses for the current year
  const yearStart = new Date(currentYear, 0, 1, 0, 0, 0, 0);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const yearTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: yearStart, lte: yearEnd },
    },
    select: {
      type: true,
      amount: true,
      date: true,
    },
  });

  const monthlyIncomeArr = Array(12).fill(0);
  const monthlyExpenseArr = Array(12).fill(0);

  for (const tx of yearTransactions) {
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

  const incomeVsExpenses: MonthlyChartPoint[] = MONTH_NAMES.map((monthName, index) => ({
    month: monthName,
    income: Number(monthlyIncomeArr[index].toFixed(2)),
    expense: Number(monthlyExpenseArr[index].toFixed(2)),
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

  // 6. All-time transaction count to determine empty state
  const allTimeTotalTransactions = await prisma.transaction.count({
    where: { userId },
  });

  return {
    summary: {
      monthlyIncome: Number(totalIncome.toFixed(2)),
      monthlyExpenses: Number(totalExpenses.toFixed(2)),
      netBalance: Number(netBalance.toFixed(2)),
      estimatedTax: Number(estimatedTax.toFixed(2)),
      savingsRate,
      totalTransactions: currentPeriodTransactions.length,
    },
    incomeVsExpenses,
    expenseBreakdown,
    recentTransactions,
    allTimeTotalTransactions,

    // Backwards-compatible fields
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netBalance: Number(netBalance.toFixed(2)),
    estimatedTax: Number(estimatedTax.toFixed(2)),
    savingsRate: `${savingsRate}%`,
  };
}