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

/**
 * Get advanced analytics for the dashboard:
 * income/expense trends, cash flow, savings trend, category growth,
 * monthly/quarterly/yearly comparisons, top categories, biggest expense,
 * highest income source, average daily spending, and prediction card.
 */
export async function getAdvancedAnalytics(userId: string, year?: number) {
  const now = new Date();
  const targetYear = (year && !isNaN(year)) ? year : now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Fetch full year transactions for analysis
  const yearStart = new Date(targetYear, 0, 1, 0, 0, 0, 0);
  const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59, 999);

  const allYearTx = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: yearStart, lte: yearEnd },
    },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      type: true,
      amount: true,
      category: true,
      description: true,
      date: true,
    },
  });

  // Fetch prior year transactions for comparison
  const priorYearStart = new Date(targetYear - 1, 0, 1, 0, 0, 0, 0);
  const priorYearEnd = new Date(targetYear - 1, 11, 31, 23, 59, 59, 999);
  const priorYearTx = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: priorYearStart, lte: priorYearEnd },
    },
    select: { type: true, amount: true, date: true, category: true },
  });

  // Build monthly buckets
  const monthlyIncome = Array(12).fill(0);
  const monthlyExpense = Array(12).fill(0);
  const monthlyCategoryMap: Record<number, Record<string, number>> = {};
  for (let i = 0; i < 12; i++) monthlyCategoryMap[i] = {};

  for (const tx of allYearTx) {
    const m = new Date(tx.date).getMonth();
    const amt = Number(tx.amount || 0);
    if (tx.type === 'income') {
      monthlyIncome[m] += amt;
    } else {
      monthlyExpense[m] += amt;
      const cat = tx.category?.trim() || 'Uncategorized';
      if (monthlyCategoryMap[m]) monthlyCategoryMap[m]![cat] = (monthlyCategoryMap[m]![cat] || 0) + amt;
    }
  }

  // Build Income Trend: % change vs prior month
  const incomeTrend = MONTH_NAMES.map((month, i) => {
    const current = monthlyIncome[i];
    const prior = i > 0 ? monthlyIncome[i - 1] : 0;
    const change = prior > 0 ? Number(((current - prior) / prior * 100).toFixed(1)) : null;
    return { month, value: Number(current.toFixed(2)), change };
  });

  // Build Expense Trend
  const expenseTrend = MONTH_NAMES.map((month, i) => {
    const current = monthlyExpense[i];
    const prior = i > 0 ? monthlyExpense[i - 1] : 0;
    const change = prior > 0 ? Number(((current - prior) / prior * 100).toFixed(1)) : null;
    return { month, value: Number(current.toFixed(2)), change };
  });

  // Cash Flow (income - expense per month)
  const cashFlow = MONTH_NAMES.map((month, i) => ({
    month,
    value: Number((monthlyIncome[i] - monthlyExpense[i]).toFixed(2)),
    positive: monthlyIncome[i] >= monthlyExpense[i],
  }));

  // Savings Trend (% of income saved)
  const savingsTrend = MONTH_NAMES.map((month, i) => {
    const inc = monthlyIncome[i];
    const exp = monthlyExpense[i];
    const rate = inc > 0 ? Number(Math.max(0, ((inc - exp) / inc) * 100).toFixed(1)) : 0;
    return { month, value: rate };
  });

  // Category Growth (compare current month to prior month for all categories)
  const catGrowth: Record<string, number> = {};
  const curMonthCats: Record<string, number> = monthlyCategoryMap[currentMonth] ?? {};
  const prevMonthCats: Record<string, number> = currentMonth > 0 ? (monthlyCategoryMap[currentMonth - 1] ?? {}) : {};
  const allCats = new Set([...Object.keys(curMonthCats), ...Object.keys(prevMonthCats)]);
  allCats.forEach(cat => {
    const cur = curMonthCats[cat] ?? 0;
    const prv = prevMonthCats[cat] ?? 0;
    catGrowth[cat] = prv > 0 ? Number(((cur - prv) / prv * 100).toFixed(1)) : (cur > 0 ? 100 : 0);
  });

  // Quarterly comparisons (Q1-Q4 income/expense)
  const quarters = [
    { label: 'Q1', months: [0, 1, 2] },
    { label: 'Q2', months: [3, 4, 5] },
    { label: 'Q3', months: [6, 7, 8] },
    { label: 'Q4', months: [9, 10, 11] },
  ];
  const quarterlyComparison = quarters.map(q => {
    const income = q.months.reduce((s, m) => s + monthlyIncome[m], 0);
    const expense = q.months.reduce((s, m) => s + monthlyExpense[m], 0);
    return {
      label: q.label,
      income: Number(income.toFixed(2)),
      expense: Number(expense.toFixed(2)),
      net: Number((income - expense).toFixed(2)),
    };
  });

  // Yearly comparison: current year vs prior year
  const priorYearIncome = priorYearTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const priorYearExpense = priorYearTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const curYearIncome = monthlyIncome.reduce((s, v) => s + v, 0);
  const curYearExpense = monthlyExpense.reduce((s, v) => s + v, 0);
  const yearlyComparison = {
    current: { year: targetYear, income: Number(curYearIncome.toFixed(2)), expense: Number(curYearExpense.toFixed(2)) },
    prior: { year: targetYear - 1, income: Number(priorYearIncome.toFixed(2)), expense: Number(priorYearExpense.toFixed(2)) },
    incomeGrowth: priorYearIncome > 0 ? Number(((curYearIncome - priorYearIncome) / priorYearIncome * 100).toFixed(1)) : null,
    expenseGrowth: priorYearExpense > 0 ? Number(((curYearExpense - priorYearExpense) / priorYearExpense * 100).toFixed(1)) : null,
  };

  // Monthly comparison: current month vs same month last year
  const priorYearMonthlyIncome = Array(12).fill(0);
  const priorYearMonthlyExpense = Array(12).fill(0);
  for (const tx of priorYearTx) {
    const m = new Date(tx.date).getMonth();
    if (tx.type === 'income') priorYearMonthlyIncome[m] += Number(tx.amount);
    else priorYearMonthlyExpense[m] += Number(tx.amount);
  }
  const monthlyComparison = MONTH_NAMES.map((month, i) => ({
    month,
    currentIncome: Number(monthlyIncome[i].toFixed(2)),
    currentExpense: Number(monthlyExpense[i].toFixed(2)),
    priorIncome: Number(priorYearMonthlyIncome[i].toFixed(2)),
    priorExpense: Number(priorYearMonthlyExpense[i].toFixed(2)),
  }));

  // Top Categories (aggregated expenses sorted)
  const globalCategoryMap: Record<string, number> = {};
  for (const tx of allYearTx) {
    if (tx.type === 'expense') {
      const cat = tx.category?.trim() || 'Uncategorized';
      globalCategoryMap[cat] = (globalCategoryMap[cat] || 0) + Number(tx.amount);
    }
  }
  const topCategories = Object.entries(globalCategoryMap)
    .map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Biggest single expense
  const biggestExpense = allYearTx
    .filter(t => t.type === 'expense')
    .sort((a, b) => Number(b.amount) - Number(a.amount))[0] || null;

  // Highest income source (by category)
  const incomeCategoryMap: Record<string, number> = {};
  for (const tx of allYearTx) {
    if (tx.type === 'income') {
      const cat = tx.category?.trim() || 'Income';
      incomeCategoryMap[cat] = (incomeCategoryMap[cat] || 0) + Number(tx.amount);
    }
  }
  const highestIncomeSource = Object.entries(incomeCategoryMap)
    .map(([source, amount]) => ({ source, amount: Number(amount.toFixed(2)) }))
    .sort((a, b) => b.amount - a.amount)[0] || null;

  // Average daily spending (for current month)
  const currentMonthTx = allYearTx.filter(tx => {
    const m = new Date(tx.date).getMonth();
    return m === currentMonth && tx.type === 'expense';
  });
  const daysElapsed = Math.max(1, now.getDate());
  const currentMonthExpenseTotal = currentMonthTx.reduce((s, t) => s + Number(t.amount), 0);
  const averageDailySpending = Number((currentMonthExpenseTotal / daysElapsed).toFixed(2));

  // Prediction: use last 3 months average to predict next month spending
  const last3Months = [currentMonth - 2, currentMonth - 1, currentMonth]
    .map(m => m < 0 ? 0 : monthlyExpense[m])
    .filter(v => v >= 0);
  const predictedNextMonthExpense = last3Months.length > 0
    ? Number((last3Months.reduce((s, v) => s + v, 0) / last3Months.length).toFixed(2))
    : 0;
  const predictedNextMonthIncome = monthlyIncome[currentMonth] > 0
    ? Number((monthlyIncome.slice(Math.max(0, currentMonth - 2), currentMonth + 1).reduce((s, v) => s + v, 0) / Math.min(3, currentMonth + 1)).toFixed(2))
    : 0;

  return {
    incomeTrend,
    expenseTrend,
    cashFlow,
    savingsTrend,
    categoryGrowth: catGrowth,
    monthlyComparison,
    quarterlyComparison,
    yearlyComparison,
    topCategories,
    biggestExpense: biggestExpense ? {
      id: biggestExpense.id,
      amount: Number(Number(biggestExpense.amount).toFixed(2)),
      category: biggestExpense.category || 'Uncategorized',
      description: biggestExpense.description || '',
      date: new Date(biggestExpense.date).toISOString(),
    } : null,
    highestIncomeSource,
    averageDailySpending,
    prediction: {
      nextMonthExpense: predictedNextMonthExpense,
      nextMonthIncome: predictedNextMonthIncome,
      projectedSavings: Number((predictedNextMonthIncome - predictedNextMonthExpense).toFixed(2)),
    },
    year: targetYear,
  };
}