import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getDashboardSummary(
  userId: string,
  period: string,
  year?: number,
  month?: number
) {
  let startDate: Date;
  let endDate: Date = new Date(); // default today

  if (year && month !== undefined) {
    // month is 0-indexed for JS Date, so subtract 1
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59, 999); // last day of the month
  } else {
    const today = new Date();
    switch (period) {
      case "daily":
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case "weekly":
        const day = today.getDay(); // 0 (Sun) - 6 (Sat)
        startDate = new Date(today);
        startDate.setDate(today.getDate() - day);
        break;
      case "monthly":
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
    }
    endDate = new Date();
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;
  const estimatedTax = totalIncome * 0.1; // simple 10%
  const savingsRate = totalIncome ? ((netBalance / totalIncome) * 100).toFixed(2) : "0";

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    estimatedTax,
    savingsRate: `${savingsRate}%`,
  };
}