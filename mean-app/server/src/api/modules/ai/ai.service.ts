// src/api/modules/ai/ai.service.ts
import {
  DEFAULT_ALLOWED_CATEGORIES,
  type AiModelResponse,
  type AggregatedFinancialMetrics,
  type FinancialSummaryAiResponse,
  type TaxSuggestionInput,
  type TaxSuggestion
} from './ai.model.js';

/**
 * Clean model output by removing markdown code block ticks if present.
 */
function extractJsonString(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  }
  return cleaned;
}

/**
 * Categorize a transaction description using Google Gemini API.
 */
export async function suggestCategory(
  description: string,
  allowedCategories: string[] = DEFAULT_ALLOWED_CATEGORIES,
  type?: string,
  amount?: number
): Promise<AiModelResponse> {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY is not configured');
  }

  const promptInstructions = `You are a financial classification assistant for the TaxPal personal finance app.
Classify the following transaction into exactly ONE category from this allowed list:
${allowedCategories.join(', ')}

Transaction Details:
Description: "${description}"
${type ? `Type: ${type}` : ''}
${amount !== undefined ? `Amount: ${amount}` : ''}

Rules:
1. Respond ONLY with a valid JSON object matching:
{"category": "<one_of_allowed_categories>", "confidence": <float_between_0_and_1>}
2. Do NOT output markdown code fences, backticks, or commentary.
3. If uncertain, choose the closest allowed category or "Other".`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptInstructions }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`AI service responded with status ${response.status}: ${errorText.slice(0, 100)}`);
    }

    const data: any = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Malformed or empty response received from AI model');
    }

    const cleanedJson = extractJsonString(candidateText);
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      throw new Error('Failed to parse AI output as JSON');
    }

    if (!parsed || typeof parsed !== 'object' || typeof parsed.category !== 'string') {
      throw new Error('AI response is missing required "category" string property');
    }

    // Match against allowed categories (case-insensitive)
    const normalizedMatch = allowedCategories.find(
      (c) => c.toLowerCase() === parsed.category.trim().toLowerCase()
    );

    const category = normalizedMatch || 'Other';
    let confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.75;
    if (isNaN(confidence) || confidence < 0) confidence = 0.5;
    if (confidence > 1) confidence = 1.0;

    return {
      category,
      confidence: Math.round(confidence * 100) / 100
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('AI service request timed out');
    }
    throw err;
  }
}

/**
 * Generate intelligent mathematical financial health analysis from actual user metrics.
 */
export function generateAnalyticalFinancialSummary(
  metrics: AggregatedFinancialMetrics
): FinancialSummaryAiResponse {
  const { period, income, expenses, savings, savingsRate, topExpenseCategory, topExpenseAmount, budgetUsage, overBudgetCategories } = metrics;

  let summary = '';
  const insights: string[] = [];
  let priority: 'low' | 'medium' | 'high' = 'low';

  const formattedIncome = Number(income || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedExpenses = Number(expenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedSavings = Number(Math.abs(savings || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 1. Determine summary narrative & priority
  if (income === 0 && expenses === 0) {
    summary = `No financial activity has been recorded for ${period} yet. Record your income or expenses to track real-time cash flow and tax analytics.`;
    insights.push(`Start by logging regular monthly income sources or recurring operational expenses.`);
    insights.push(`Set up category budget limits to prevent overspending as transactions accumulate.`);
    insights.push(`Monitor estimated quarterly tax brackets to prepare for end-of-period filing.`);
    priority = 'low';
    return { summary, insights, priority };
  }

  if (expenses > income) {
    priority = 'high';
    summary = `For ${period}, total expenditures ($${formattedExpenses}) exceeded recorded income ($${formattedIncome}) by $${formattedSavings}. Reviewing discretionary costs is recommended to stabilize cash reserves.`;
  } else if (savingsRate >= 25) {
    priority = 'low';
    summary = `Strong financial performance in ${period}! You generated $${formattedIncome} in income and retained $${formattedSavings} with an exceptional ${savingsRate}% net savings rate.`;
  } else if (savingsRate >= 10) {
    priority = 'low';
    summary = `Steady financial balance in ${period}. You earned $${formattedIncome} and kept expenses at $${formattedExpenses}, achieving a healthy ${savingsRate}% savings rate.`;
  } else {
    priority = 'medium';
    summary = `For ${period}, income reached $${formattedIncome} with $${formattedExpenses} in spending, resulting in a tight ${savingsRate}% savings margin ($${formattedSavings} retained).`;
  }

  // 2. Generate Insights
  // Insight 1: Spending breakdown
  if (topExpenseCategory && topExpenseCategory !== 'None' && topExpenseAmount > 0) {
    const expenseShare = expenses > 0 ? Math.round((topExpenseAmount / expenses) * 100) : 0;
    insights.push(`Largest spending was in ${topExpenseCategory} at $${topExpenseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${expenseShare}% of period outflow).`);
  } else if (expenses === 0 && income > 0) {
    insights.push(`Zero expenses recorded for this period—100% of income retained in net savings.`);
  }

  // Insight 2: Savings rate analysis
  if (income > 0) {
    if (savingsRate >= 20) {
      insights.push(`Your ${savingsRate}% savings rate surpasses the standard 20% benchmark for healthy personal emergency funds.`);
    } else if (savingsRate > 0) {
      insights.push(`Your current savings rate is ${savingsRate}%. Trimming discretionary expenses could help you reach the recommended 20% target.`);
    } else {
      insights.push(`Net negative cash flow detected. Consider auditing recurring subscriptions to restore positive savings.`);
    }
  } else if (expenses > 0) {
    insights.push(`No incoming earnings logged for ${period}. Ensure all salary, client invoices, or side-gig deposits are recorded.`);
  }

  // Insight 3: Budget or Tax health
  if (budgetUsage > 0) {
    if (overBudgetCategories > 0) {
      priority = 'high';
      insights.push(`${overBudgetCategories} category budget limit(s) exceeded with ${budgetUsage}% overall budget allocation used.`);
    } else if (budgetUsage > 80) {
      insights.push(`Budget consumption is near threshold at ${budgetUsage}%. Keep upcoming expenditures restrained.`);
    } else {
      insights.push(`Budget execution is well-controlled with only ${budgetUsage}% of overall budget utilized.`);
    }
  } else {
    insights.push(`Estimated tax liability tracks at approximately 15% of net positive savings for proactive quarterly planning.`);
  }

  // Ensure exactly 2 to 3 quality insights
  if (insights.length < 2) {
    insights.push(`Maintain regular transaction logging to maximize automated deduction opportunities.`);
  }

  return {
    summary,
    insights: insights.slice(0, 3),
    priority
  };
}

/**
 * Generate structured Financial Health Summary using Google Gemini API with intelligent analytical fallback.
 */
export async function generateFinancialSummary(
  metrics: AggregatedFinancialMetrics
): Promise<FinancialSummaryAiResponse> {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-google-gemini') || apiKey.includes('AIzaSyYourActualKey')) {
    return generateAnalyticalFinancialSummary(metrics);
  }

  const promptInstructions = `You are a personal finance assistant for the TaxPal app.
Analyze the following aggregated financial metrics for the period "${metrics.period}":
- Total Income: $${metrics.income}
- Total Expenses: $${metrics.expenses}
- Net Savings: $${metrics.savings}
- Savings Rate: ${metrics.savingsRate}%
- Top Expense Category: ${metrics.topExpenseCategory} ($${metrics.topExpenseAmount})
- Overall Budget Usage: ${metrics.budgetUsage}%
- Over-Budget Categories: ${metrics.overBudgetCategories}

Rules:
1. Provide a concise financial summary (1 to 3 sentences).
2. Provide a list of key insights (maximum 3 bullet items).
3. Set priority to exactly one of: "low", "medium", "high" based on financial health:
   - "high": expenses exceed income or multiple over-budget categories
   - "medium": budget usage > 80% or low savings rate (< 10%)
   - "low": healthy savings rate and spending within budget
4. Base all statements strictly on the provided numbers. Do NOT invent new facts or figures.
5. Do NOT provide professional financial, tax, or investment advice.
6. Keep the tone constructive, neutral, and encouraging.
7. Respond ONLY with a valid JSON object matching:
{
  "summary": "<1-3 sentences>",
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "priority": "low" | "medium" | "high"
}
8. Do NOT wrap output in markdown code blocks or backticks. Return raw JSON only.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptInstructions }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return generateAnalyticalFinancialSummary(metrics);
    }

    const data: any = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return generateAnalyticalFinancialSummary(metrics);
    }

    const cleanedJson = extractJsonString(candidateText);
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      return generateAnalyticalFinancialSummary(metrics);
    }

    if (!parsed || typeof parsed !== 'object') {
      return generateAnalyticalFinancialSummary(metrics);
    }

    // Validate and sanitize summary (string, non-empty)
    const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : `During ${metrics.period}, you recorded $${metrics.income} in income and $${metrics.expenses} in expenses.`;

    // Validate and sanitize insights (array of strings, max 3)
    const rawInsights = Array.isArray(parsed.insights) ? parsed.insights : [];
    const insights: string[] = rawInsights
      .filter((item: unknown) => typeof item === 'string' && (item as string).trim())
      .map((item: string) => item.trim())
      .slice(0, 3);

    // Validate priority
    const allowedPriorities = ['low', 'medium', 'high'] as const;
    const priority = typeof parsed.priority === 'string' && allowedPriorities.includes(parsed.priority.toLowerCase() as any)
      ? (parsed.priority.toLowerCase() as 'low' | 'medium' | 'high')
      : 'low';

    return {
      summary,
      insights: insights.length > 0 ? insights : generateAnalyticalFinancialSummary(metrics).insights,
      priority
    };
  } catch {
    clearTimeout(timeoutId);
    return generateAnalyticalFinancialSummary(metrics);
  }
}

/**
 * Generate AI tax-saving and deduction review suggestions using Google Gemini API.
 */
export async function suggestTaxDeductions(
  input: TaxSuggestionInput
): Promise<TaxSuggestion[]> {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY is not configured');
  }

  const promptInstructions = `You are a tax education assistant for the TaxPal app.
Analyze the following user-provided tax estimation inputs to identify potential tax-saving or deduction areas for the user to review:
- Gross Income: $${input.income}
${input.region ? `- Region/Country: ${input.region}` : ''}
${input.state ? `- State/Province: ${input.state}` : ''}
${input.filingStatus ? `- Filing Status: ${input.filingStatus}` : ''}
${input.quarter ? `- Quarter: ${input.quarter}` : ''}
- Business Expenses Entered: $${input.businessExpenses ?? 0}
- Health Insurance Entered: $${input.healthInsurance ?? 0}
- Retirement Contributions Entered: $${input.retirement ?? 0}
- Home Office Deduction Entered: $${input.homeOffice ?? 0}
${input.additionalDeductions !== undefined ? `- Additional Deductions: $${input.additionalDeductions}` : ''}

Rules:
1. Identify up to 3 potential deduction or tax-saving areas worth reviewing based on the entered values (e.g. if health insurance, retirement, or home office is zero or low).
2. For each suggestion, provide:
   - "title": concise name of the deduction or review area
   - "description": 1-2 sentence cautious explanation emphasizing that eligibility depends on individual circumstances
   - "priority": "low" | "medium" | "high" (high if common eligible expense with $0 currently entered)
3. Cautious language requirement:
   - Use words like "may", "could", "consider reviewing".
   - Do NOT claim or guarantee that the user qualifies for any deduction.
   - Do NOT invent specific statutory legal thresholds or claim authoritative tax laws.
   - Mention that the user should consult official guidelines or a qualified tax professional.
4. Respond ONLY with a valid JSON object matching:
{
  "suggestions": [
    {
      "title": "<Area title>",
      "description": "<Cautious explanation>",
      "priority": "low" | "medium" | "high"
    }
  ]
}
5. Maximum 3 suggestions in the array.
6. Do NOT wrap output in markdown code blocks or backticks. Return raw JSON only.
7. This is informational guidance, not professional tax advice.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptInstructions }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 400
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`AI service responded with status ${response.status}: ${errorText.slice(0, 100)}`);
    }

    const data: any = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Malformed or empty response received from AI model');
    }

    const cleanedJson = extractJsonString(candidateText);
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      throw new Error('Failed to parse AI output as JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON structure returned by AI');
    }

    const rawList = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    const allowedPriorities = ['low', 'medium', 'high'] as const;

    const suggestions: TaxSuggestion[] = rawList
      .filter((s: unknown) => s && typeof s === 'object')
      .map((s: any) => {
        const title = typeof s.title === 'string' && s.title.trim() ? s.title.trim() : 'General Deduction Review';
        const description = typeof s.description === 'string' && s.description.trim()
          ? s.description.trim()
          : 'Consider reviewing whether any eligible expenses apply under applicable tax guidelines.';
        const priority = typeof s.priority === 'string' && allowedPriorities.includes(s.priority.toLowerCase() as any)
          ? (s.priority.toLowerCase() as 'low' | 'medium' | 'high')
          : 'low';

        return { title, description, priority };
      })
      .slice(0, 3);

    return suggestions;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('AI service request timed out');
    }
    throw err;
  }
}
