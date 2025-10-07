import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getDashboardSummary(
  userId: string,
  period: "daily" | "weekly" | "monthly",
  year?: number,
  month?: number
) {
  let startDate: Date;
  let endDate: Date;

  if (year && month !== undefined) {
    // Month is 1-based in our API, convert to 0-based for Date()
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
  } else {
    const today = new Date();

    switch (period) {
      case "daily":
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today); // today end
        break;

      case "weekly":
        const day = today.getDay(); // 0 (Sun) - 6 (Sat)
        startDate = new Date(today);
        startDate.setDate(today.getDate() - day); // start of week (Sunday)
        endDate = new Date(today); // today
        break;

      case "monthly":
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today); // today
        break;
    }
  }

  // ✅ Transactions fetch
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
  });

  // ✅ Calculations (safe type casting)
const totalIncome = transactions
  .filter((t) => t.type === "income")
  .reduce((sum, t) => sum + Number(t.amount), 0);

const totalExpenses = transactions
  .filter((t) => t.type === "expense")
  .reduce((sum, t) => sum + Number(t.amount), 0);


  const netBalance = totalIncome - totalExpenses;
  const estimatedTax = totalIncome * 0.1; // simple 10%
  const savingsRate = totalIncome
    ? ((netBalance / totalIncome) * 100).toFixed(2)
    : "0.00";

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    estimatedTax,
    savingsRate: `${savingsRate}%`,
    range: { startDate, endDate }, // ✅ helpful for frontend
  };
}
