// src/api/modules/ai/ai.controller.ts
import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import { prisma } from '../../../config/prisma.client.js';
import * as aiService from './ai.service.js';
import { DEFAULT_ALLOWED_CATEGORIES, type AggregatedFinancialMetrics } from './ai.model.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FALLBACK_SUMMARY = {
  summary: 'Financial insights are temporarily unavailable.',
  insights: [],
  priority: 'low' as const
};

export async function categorizeTransaction(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { description, amount, type } = req.body ?? {};

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Transaction description is required'
      });
    }

    // Retrieve user-defined categories to ensure AI stays aligned with their personal taxonomy
    let allowedCategories = [...DEFAULT_ALLOWED_CATEGORIES];
    try {
      const userCategories = await prisma.category.findMany({
        where: { userId },
        select: { name: true }
      });
      const customNames = userCategories.map((c) => c.name.trim()).filter(Boolean);
      allowedCategories = Array.from(new Set([...allowedCategories, ...customNames]));
    } catch {
      // Fallback to DEFAULT_ALLOWED_CATEGORIES if custom category lookup fails
    }

    const suggestion = await aiService.suggestCategory(
      description.trim(),
      allowedCategories,
      typeof type === 'string' ? type : undefined,
      typeof amount === 'number' ? amount : undefined
    );

    return res.json({
      success: true,
      category: suggestion.category,
      confidence: suggestion.confidence
    });
  } catch (err: any) {
    const message = err?.message || '';

    if (message.includes('not configured') || message.includes('AI_API_KEY')) {
      return res.status(503).json({
        success: false,
        fallback: true,
        message: 'Category suggestion is currently unavailable. You can select a category manually.'
      });
    }

    if (message.includes('timed out') || message.includes('AI service responded') || message.includes('parse')) {
      return res.status(502).json({
        success: false,
        fallback: true,
        message: 'Category suggestion is currently unavailable. You can select a category manually.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to process AI category suggestion'
    });
  }
}

/**
 * Endpoint handler: GET /api/ai/financial-summary?period=monthly|quarterly|yearly
 */
export async function getFinancialSummary(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const periodParam = ((req.query.period as string) || 'monthly').toLowerCase();
    const validPeriod = periodParam === 'quarterly' || periodParam === 'yearly' ? periodParam : 'monthly';

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();

    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;

    if (validPeriod === 'yearly') {
      startDate = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, 12, 0, 23, 59, 59, 999);
      periodLabel = `${currentYear} (Full Year)`;
    } else if (validPeriod === 'quarterly') {
      const quarterIndex = Math.floor(currentMonthIndex / 3);
      const quarterStartMonth = quarterIndex * 3;
      const quarterEndMonth = quarterStartMonth + 2;
      startDate = new Date(currentYear, quarterStartMonth, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, quarterEndMonth + 1, 0, 23, 59, 59, 999);
      periodLabel = `Q${quarterIndex + 1} ${currentYear} (${MONTH_NAMES[quarterStartMonth]} - ${MONTH_NAMES[quarterEndMonth]})`;
    } else {
      startDate = new Date(currentYear, currentMonthIndex, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, currentMonthIndex + 1, 0, 23, 59, 59, 999);
      periodLabel = `${MONTH_NAMES[currentMonthIndex]} ${currentYear}`;
    }

    // 1. Fetch user transactions within the selected period
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      },
      select: {
        amount: true,
        type: true,
        category: true
      }
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryExpenses = new Map<string, number>();

    for (const tx of transactions) {
      const amt = Number(tx.amount || 0);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else if (tx.type === 'expense') {
        totalExpenses += amt;
        const cat = tx.category?.trim() || 'Other';
        categoryExpenses.set(cat, (categoryExpenses.get(cat) || 0) + amt);
      }
    }

    totalIncome = Number(totalIncome.toFixed(2));
    totalExpenses = Number(totalExpenses.toFixed(2));
    const netSavings = Number((totalIncome - totalExpenses).toFixed(2));
    const savingsRate = totalIncome > 0
      ? Number(Math.max(0, ((netSavings / totalIncome) * 100)).toFixed(1))
      : 0;

    let topExpenseCategory = 'None';
    let topExpenseAmount = 0;
    for (const [cat, amt] of categoryExpenses.entries()) {
      if (amt > topExpenseAmount) {
        topExpenseCategory = cat;
        topExpenseAmount = Number(amt.toFixed(2));
      }
    }

    // 2. Compute budget usage from user's configured budgets
    let totalBudgetLimit = 0;
    let totalBudgetSpent = 0;
    let overBudgetCategories = 0;

    try {
      const userBudgets = await prisma.budget.findMany({
        where: {
          userId,
          month: { gte: startDate, lte: endDate }
        }
      });

      for (const b of userBudgets) {
        const limit = Number(b.amount || 0);
        totalBudgetLimit += limit;
        const spent = categoryExpenses.get(b.category.trim()) || 0;
        totalBudgetSpent += spent;
        if (spent > limit) {
          overBudgetCategories++;
        }
      }
    } catch {
      // Gracefully continue with 0 if budget read fails
    }

    const budgetUsage = totalBudgetLimit > 0
      ? Number(((totalBudgetSpent / totalBudgetLimit) * 100).toFixed(1))
      : 0;

    const metrics: AggregatedFinancialMetrics = {
      period: periodLabel,
      income: totalIncome,
      expenses: totalExpenses,
      savings: netSavings,
      savingsRate,
      topExpenseCategory,
      topExpenseAmount,
      budgetUsage,
      overBudgetCategories
    };

    // 3. Delegate to AI service for qualitative summary and insights
    const aiResult = await aiService.generateFinancialSummary(metrics);

    return res.json({
      success: true,
      data: aiResult
    });
  } catch (err: any) {
    const message = err?.message || '';

    if (message.includes('not configured') || message.includes('AI_API_KEY')) {
      return res.status(503).json({
        success: false,
        fallback: true,
        message: 'Financial insights are temporarily unavailable.',
        data: FALLBACK_SUMMARY
      });
    }

    if (
      message.includes('timed out') ||
      message.includes('AI service responded') ||
      message.includes('parse') ||
      message.includes('Malformed') ||
      message.includes('Invalid JSON')
    ) {
      return res.status(502).json({
        success: false,
        fallback: true,
        message: 'Financial insights are temporarily unavailable.',
        data: FALLBACK_SUMMARY
      });
    }

    return res.status(500).json({
      success: false,
      fallback: true,
      message: 'Financial insights are temporarily unavailable.',
      data: FALLBACK_SUMMARY
    });
  }
}
