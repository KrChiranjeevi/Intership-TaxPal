// src/api/modules/ai/ai.controller.ts
import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import { prisma } from '../../../config/prisma.client.js';
import * as aiService from './ai.service.js';
import {
  DEFAULT_ALLOWED_CATEGORIES,
  type AggregatedFinancialMetrics,
  type TaxSuggestionInput
} from './ai.model.js';

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
    console.error('getFinancialSummary error, falling back to analytical summary:', err?.message || err);

    const safeMetrics: AggregatedFinancialMetrics = {
      period: 'Current Period',
      income: 0,
      expenses: 0,
      savings: 0,
      savingsRate: 0,
      topExpenseCategory: 'None',
      topExpenseAmount: 0,
      budgetUsage: 0,
      overBudgetCategories: 0
    };

    return res.json({
      success: true,
      data: aiService.generateAnalyticalFinancialSummary(safeMetrics)
    });
  }
}

/**
 * Endpoint handler: POST /api/ai/tax-suggestions
 */
export async function getTaxSuggestions(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      income,
      region,
      state,
      quarter,
      filingStatus,
      businessExpenses,
      retirement,
      healthInsurance,
      homeOffice,
      additionalDeductions
    } = req.body ?? {};

    if (typeof income !== 'number' || isNaN(income) || income <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid positive income is required for tax deduction suggestions'
      });
    }

    const input: TaxSuggestionInput = {
      income,
      region: typeof region === 'string' ? region : undefined,
      state: typeof state === 'string' ? state : undefined,
      quarter: typeof quarter === 'string' ? quarter : undefined,
      filingStatus: typeof filingStatus === 'string' ? filingStatus : undefined,
      businessExpenses: typeof businessExpenses === 'number' ? businessExpenses : undefined,
      retirement: typeof retirement === 'number' ? retirement : undefined,
      healthInsurance: typeof healthInsurance === 'number' ? healthInsurance : undefined,
      homeOffice: typeof homeOffice === 'number' ? homeOffice : undefined,
      additionalDeductions: typeof additionalDeductions === 'number' ? additionalDeductions : undefined
    };

    const suggestions = await aiService.suggestTaxDeductions(input);

    return res.json({
      success: true,
      suggestions
    });
  } catch (err: any) {
    const message = err?.message || '';

    if (message.includes('not configured') || message.includes('AI_API_KEY')) {
      return res.status(503).json({
        success: false,
        fallback: true,
        message: 'Tax suggestions are temporarily unavailable (API key not configured).',
        suggestions: []
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
        message: 'Tax suggestions are temporarily unavailable. You can continue using the Tax Estimator normally.',
        suggestions: []
      });
    }

    return res.status(500).json({
      success: false,
      fallback: true,
      message: 'Tax suggestions are temporarily unavailable. You can continue using the Tax Estimator normally.',
      suggestions: []
    });
  }
}

function generateFallbackChatReply(params: {
  message: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  topCatStr: string;
  transactionsCount: number;
}): string {
  const q = params.message.toLowerCase().trim();

  // Greetings
  if (/^(hy|hi|hello|hey|hola|namaste|greetings|good\s*(morning|afternoon|evening))/i.test(q)) {
    return "👋 Hi! I'm **TaxPal AI**, your personal finance assistant.\n\nI can help you analyze your spending, give savings advice, explain tax deductions, or review your budgets. How can I help you today?";
  }

  // How much did I spend / Expenses / Spending
  if (/(spend|spent|expense|outflow|cost|kharcha)/i.test(q)) {
    if (params.totalExpense > 0) {
      return `📊 In the last 90 days, your recorded expenses total **₹${params.totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}** across ${params.transactionsCount} transaction(s).\n\n${params.topCatStr ? `🏆 **Top Spending Categories**: ${params.topCatStr}` : ''}`;
    }
    return "📊 You haven't recorded any expenses in the last 90 days yet. Click **+ Add Expense** on your dashboard to start tracking!";
  }

  // Income / Earnings
  if (/(income|earn|salary|revenue|inflow|kamai)/i.test(q)) {
    if (params.totalIncome > 0) {
      return `💰 In the last 90 days, your total recorded income is **₹${params.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}**.\n\n📈 **Net Savings**: **₹${params.netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}**.`;
    }
    return "💰 No income records found for the last 90 days. You can record income via **+ Add Income** on your dashboard.";
  }

  // Highest expense / Biggest expense / Top category
  if (/(highest|biggest|largest|top\s*categor|most)/i.test(q)) {
    if (params.topCatStr) {
      return `🔍 **Highest Spending Categories** (Last 90 Days):\n${params.topCatStr}\n\n💡 Tip: Review these categories to find quick opportunities to reduce discretionary spending!`;
    }
    return "🔍 You don't have any expense categories recorded yet. Add your expenses to see category breakdowns.";
  }

  // Savings / Saving tips / Suggest savings
  if (/(sav(e|ing)|invest|emergency\s*fund|bachat)/i.test(q)) {
    return `💡 **Smart Savings Strategies**:\n\n` +
      `1. **50/30/20 Rule**: Allocate 50% of your income to essentials, 30% to discretionary wants, and 20% directly to savings or debt repayment.\n` +
      `2. **Build an Emergency Fund**: Stash 3–6 months of basic living expenses into a liquid savings account or recurring deposit.\n` +
      `3. **Set Monthly Category Budgets**: Head to the **Budget** tab to place caps on discretionary categories like Dining and Entertainment.\n` +
      `4. **Automate Savings**: Set up automated transfers on payday before spending starts.`;
  }

  // Tax / Reduce tax / Deductions
  if (/(tax|deduct|80c|80d|itr|regime)/i.test(q)) {
    return `📋 **Tax-Saving Advice**:\n\n` +
      `• **Section 80C**: Claim up to **₹1,50,000** through investments in EPF, PPF, ELSS mutual funds, and Life Insurance premiums.\n` +
      `• **Section 80D**: Deduct up to **₹25,000** (₹50,000 for senior citizens) for health insurance premiums.\n` +
      `• **National Pension System (NPS)**: An additional **₹50,000** deduction is available under **Section 80CCD(1B)**.\n` +
      `• **Tax Estimator**: Visit our **Tax Estimation** module in the sidebar to compare Old vs. New Tax Regime liabilities based on your actual income.`;
  }

  // Budget advice / Budget
  if (/(budget|limit|plan|track)/i.test(q)) {
    return `🎯 **Budget Planning Tips**:\n\n` +
      `• Create realistic monthly limits for your top variable expense categories.\n` +
      `• Enable notifications so TaxPal alerts you when you cross 80% of your category limit.\n` +
      `• Use our **Budget Goals** feature to track savings for specific milestones (vacation, down payment, emergency fund).`;
  }

  // Who are you / What can you do / Help
  if (/(who\s*are\s*you|what\s*can\s*you\s*do|help|feature)/i.test(q)) {
    return `🤖 I am **TaxPal AI**, your intelligent financial companion!\n\nHere is what you can ask me:\n` +
      `• *"How much did I spend this month?"*\n` +
      `• *"What is my highest expense category?"*\n` +
      `• *"Suggest ways to save money"*\n` +
      `• *"How to reduce tax?"*\n` +
      `• *"Give me budget advice"*`;
  }

  // Default contextual financial summary
  return `I've analyzed your financial profile for the last 90 days:\n\n` +
    `• **Total Income**: ₹${params.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
    `• **Total Expenses**: ₹${params.totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
    `• **Net Savings**: ₹${params.netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\n` +
    `How can I help you further? You can ask about **spending**, **saving tips**, **tax deductions**, or **budget advice**!`;
}

/**
 * POST /api/ai/chat
 * Floating AI Financial Assistant proxy — sends user message with financial context to Gemini
 */
export async function chatWithAssistant(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { message, history } = req.body ?? {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // Fetch last 90 days of transactions for context
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'desc' },
      take: 60,
      select: { type: true, amount: true, category: true, description: true, date: true }
    });

    const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const netSavings   = totalIncome - totalExpense;

    const topCategories: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Uncategorized';
      topCategories[cat] = (topCategories[cat] || 0) + Number(t.amount);
    });
    const topCatStr = Object.entries(topCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(0)}`)
      .join(', ');

    const fallbackReply = generateFallbackChatReply({
      message,
      totalIncome,
      totalExpense,
      netSavings,
      topCatStr,
      transactionsCount: transactions.length
    });

    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your-google-gemini') || apiKey.includes('AIzaSyYourActualKey')) {
      return res.json({ success: true, reply: fallbackReply });
    }

    const systemContext = `You are TaxPal AI, a personal finance assistant. 
The user's financial data for the last 90 days:
- Total Income: ₹${totalIncome.toFixed(2)}
- Total Expenses: ₹${totalExpense.toFixed(2)}
- Net Savings: ₹${netSavings.toFixed(2)}
- Top Expense Categories: ${topCatStr || 'No data yet'}
- Total Transactions: ${transactions.length}

Answer only finance-related questions (spending, savings, tax, budget advice). 
Be concise and helpful. Use ₹ for currency. Format numbers nicely.
If asked something unrelated to finance, politely redirect to financial topics.`;

    // Build Gemini chat history
    const chatHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [
      { role: 'user', parts: [{ text: systemContext }] },
      { role: 'model', parts: [{ text: 'Understood! I am TaxPal AI, ready to help with your finances.' }] }
    ];

    if (Array.isArray(history)) {
      for (const msg of history.slice(-10)) { // last 10 messages for context
        if (msg.role === 'user' || msg.role === 'model') {
          chatHistory.push({ role: msg.role, parts: [{ text: String(msg.text || '') }] });
        }
      }
    }

    const requestBody = {
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: message.trim() }] }
      ],
      generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json() as any;
        const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim()) {
          return res.json({ success: true, reply: reply.trim() });
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // Graceful fallback if Gemini request fails, times out, or quota is exceeded
    return res.json({ success: true, reply: fallbackReply });
  } catch (err) {
    console.error('AI chat error:', err);
    return res.json({
      success: true,
      reply: "👋 Hi! I'm **TaxPal AI**. How can I assist you with your spending, budget, or taxes today?"
    });
  }
}

