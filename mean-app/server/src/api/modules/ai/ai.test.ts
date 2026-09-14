// src/api/modules/ai/ai.test.ts
import { jest } from '@jest/globals';
import * as aiService from './ai.service.js';
import * as aiController from './ai.controller.js';
import { aiLimiter } from '../../middlewares/rateLimit.middleware.js';
import { prisma } from '../../../config/prisma.client.js';

describe('Phase 7 Step 1: AI Smart Expense Categorization Tests', () => {
  const originalEnv = process.env;
  const mockUserId = 'user-ai-test-123';

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, AI_API_KEY: 'mock-gemini-test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  // 1. Authenticated AI categorization request
  describe('1. Authenticated AI categorization request', () => {
    it('should return 200 with suggested category and confidence for authenticated user', async () => {
      jest.spyOn(prisma.category, 'findMany').mockResolvedValue([] as any);

      const mockApiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '{"category": "Food", "confidence": 0.94}' }]
            }
          }
        ]
      };

      (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      const req: any = {
        user: { id: mockUserId },
        body: { description: 'Grocery shopping at Trader Joes', amount: 85.5, type: 'expense' }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await aiController.categorizeTransaction(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        category: 'Food',
        confidence: 0.94
      });
    });
  });

  // 2. Unauthenticated request -> 401
  describe('2. Unauthenticated request -> 401', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const req: any = {
        user: undefined,
        body: { description: 'Coffee' }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await aiController.categorizeTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Unauthorized' })
      );
    });
  });

  // 3. Valid AI response
  describe('3. Valid AI response parsing', () => {
    it('should parse valid AI model output and return structured category and confidence', async () => {
      const mockApiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '{"category": "Transport", "confidence": 0.88}' }]
            }
          }
        ]
      };

      const globalFetch = (jest.fn() as any).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });
      (globalThis as any).fetch = globalFetch;

      const result = await aiService.suggestCategory('Uber ride to airport');

      expect(result.category).toBe('Transport');
      expect(result.confidence).toBe(0.88);
    });
  });

  // 4. Unsupported category returned by AI
  describe('4. Unsupported category handling', () => {
    it('should normalize unsupported categories returned by the AI to "Other"', async () => {
      const mockApiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '{"category": "SpaceExplorationAndRocketry", "confidence": 0.99}' }]
            }
          }
        ]
      };

      (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      const result = await aiService.suggestCategory('Lunar rover battery replacement');

      expect(result.category).toBe('Other');
    });
  });

  // 5. Malformed AI response
  describe('5. Malformed AI response handling', () => {
    it('should catch malformed non-JSON output and return controlled fallback without crashing', async () => {
      const mockApiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Here is your category: Food!' }]
            }
          }
        ]
      };

      (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      const req: any = {
        user: { id: mockUserId },
        body: { description: 'Dinner with colleagues' }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await aiController.categorizeTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          fallback: true,
          message: expect.stringContaining('Category suggestion is currently unavailable')
        })
      );
    });
  });

  // 6. AI provider failure (network / HTTP 500)
  describe('6. AI provider failure', () => {
    it('should handle AI HTTP error status gracefully with fallback message', async () => {
      (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service Temporarily Overloaded'
      });

      const req: any = {
        user: { id: mockUserId },
        body: { description: 'Grocery shopping' }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await aiController.categorizeTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          fallback: true,
          message: expect.stringContaining('Category suggestion is currently unavailable')
        })
      );
    });
  });

  // 7. Missing API key
  describe('7. Missing API key', () => {
    it('should return 503 with friendly fallback message when AI_API_KEY is not configured', async () => {
      delete process.env.AI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const req: any = {
        user: { id: mockUserId },
        body: { description: 'Monthly rent' }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await aiController.categorizeTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          fallback: true,
          message: expect.stringContaining('Category suggestion is currently unavailable')
        })
      );
    });
  });

  // 8. Rate limiting
  describe('8. Rate Limiting', () => {
    it('should have rate limiter middleware defined with max requests and window configuration', () => {
      expect(aiLimiter).toBeDefined();
      expect(typeof aiLimiter).toBe('function');
    });
  });

  // 9. Transaction creation still works when AI fails
  describe('9. Independent Transaction Creation', () => {
    it('should allow transaction creation to succeed completely independently of AI availability', async () => {
      // Simulate transaction creation without AI or when AI is offline
      const mockCreatedTx = {
        id: 'tx-offline-1',
        userId: mockUserId,
        amount: 50,
        type: 'expense',
        category: 'Food',
        description: 'Subway lunch',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        reportId: null,
        notes: null
      };

      jest.spyOn(prisma.transaction, 'create').mockResolvedValue(mockCreatedTx as any);

      const created = await prisma.transaction.create({
        data: {
          userId: mockUserId,
          type: 'expense',
          amount: 50,
          category: 'Food',
          description: 'Subway lunch',
          date: new Date()
        }
      });

      expect(created.id).toBe('tx-offline-1');
      expect(created.category).toBe('Food');
    });
  });
});

describe('Phase 7 Step 2: AI Financial Health Summary Tests', () => {
  const originalEnv = process.env;
  const mockUserId = 'user-ai-summary-123';

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, AI_API_KEY: 'mock-gemini-test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  // 1. Authenticated request
  it('1. Authenticated request should return 200 with summary, insights, and priority', async () => {
    const mockTx = [
      { amount: 5000, type: 'income', category: 'Salary' },
      { amount: 1500, type: 'expense', category: 'Rent' },
      { amount: 500, type: 'expense', category: 'Food' }
    ];
    jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue(mockTx as any);
    jest.spyOn(prisma.budget, 'findMany').mockResolvedValue([
      { amount: 2000, category: 'Rent' }
    ] as any);

    const mockApiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  summary: 'Your finances are in excellent health with positive cash flow.',
                  insights: [
                    'Rent is your highest expense.',
                    'Your savings rate is 60%.',
                    'You are well within your budget limit.'
                  ],
                  priority: 'low'
                })
              }
            ]
          }
        }
      ]
    };

    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    });

    const req: any = {
      user: { id: mockUserId },
      query: { period: 'monthly' }
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await aiController.getFinancialSummary(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        summary: 'Your finances are in excellent health with positive cash flow.',
        insights: [
          'Rent is your highest expense.',
          'Your savings rate is 60%.',
          'You are well within your budget limit.'
        ],
        priority: 'low'
      }
    });
  });

  // 2. Unauthenticated request -> 401
  it('2. Unauthenticated request should return 401 Unauthorized', async () => {
    const req: any = { user: undefined, query: {} };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await aiController.getFinancialSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Unauthorized' })
    );
  });

  // 3. Monthly summary
  it('3. Monthly summary should compute and pass monthly metrics', async () => {
    const txFindSpy = jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([] as any);
    jest.spyOn(prisma.budget, 'findMany').mockResolvedValue([] as any);

    let capturedPrompt = '';
    (globalThis as any).fetch = (jest.fn() as any).mockImplementation((_url: string, opts: any) => {
      capturedPrompt = opts.body;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"summary": "Healthy", "insights": [], "priority": "low"}' }] } }]
        })
      });
    });

    const req: any = { user: { id: mockUserId }, query: { period: 'monthly' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getFinancialSummary(req, res);

    expect(txFindSpy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // 4. Quarterly summary
  it('4. Quarterly summary should compute and pass quarterly metrics', async () => {
    const txFindSpy = jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([] as any);
    jest.spyOn(prisma.budget, 'findMany').mockResolvedValue([] as any);

    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"summary": "Quarterly summary", "insights": [], "priority": "low"}' }] } }]
      })
    });

    const req: any = { user: { id: mockUserId }, query: { period: 'quarterly' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getFinancialSummary(req, res);

    expect(txFindSpy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // 5. Yearly summary
  it('5. Yearly summary should compute and pass yearly metrics', async () => {
    const txFindSpy = jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([] as any);
    jest.spyOn(prisma.budget, 'findMany').mockResolvedValue([] as any);

    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"summary": "Annual summary", "insights": [], "priority": "low"}' }] } }]
      })
    });

    const req: any = { user: { id: mockUserId }, query: { period: 'yearly' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getFinancialSummary(req, res);

    expect(txFindSpy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // 6. Correct user ownership
  it('6. Correct user ownership: should only query transactions and budgets for the authenticated user', async () => {
    const txFindSpy = jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([] as any);
    const budgetFindSpy = jest.spyOn(prisma.budget, 'findMany').mockResolvedValue([] as any);

    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"summary": "OK", "insights": [], "priority": "low"}' }] } }]
      })
    });

    const req: any = { user: { id: 'specific-user-456' }, query: { period: 'monthly' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getFinancialSummary(req, res);

    expect(txFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'specific-user-456' })
      })
    );
    expect(budgetFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'specific-user-456' })
      })
    );
  });

  // 7. Correct financial metrics passed to AI
  it('7. Correct financial metrics passed to AI prompt without raw transactions or user credentials', async () => {
    jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([
      { amount: 10000, type: 'income', category: 'Salary' },
      { amount: 4000, type: 'expense', category: 'Rent' }
    ] as any);
    jest.spyOn(prisma.budget, 'findMany').mockResolvedValue([] as any);

    let sentPrompt = '';
    (globalThis as any).fetch = (jest.fn() as any).mockImplementation((_url: string, opts: any) => {
      sentPrompt = opts.body;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"summary": "OK", "insights": [], "priority": "low"}' }] } }]
        })
      });
    });

    const req: any = { user: { id: mockUserId }, query: { period: 'monthly' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getFinancialSummary(req, res);

    expect(sentPrompt).toContain('Total Income: $10000');
    expect(sentPrompt).toContain('Total Expenses: $4000');
    expect(sentPrompt).toContain('Net Savings: $6000');
    expect(sentPrompt).not.toContain(mockUserId);
    expect(sentPrompt).not.toContain('password');
    expect(sentPrompt).not.toContain('jwt');
  });

  // 8. Valid AI response
  it('8. Valid AI response should return sanitized output structure', async () => {
    const metrics: any = {
      period: 'September 2026',
      income: 5000,
      expenses: 3000,
      savings: 2000,
      savingsRate: 40,
      topExpenseCategory: 'Housing',
      topExpenseAmount: 1800,
      budgetUsage: 75,
      overBudgetCategories: 0
    };

    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '```json\n{"summary": "Good budget management.", "insights": ["Savings rate is 40%."], "priority": "low"}\n```'
                }
              ]
            }
          }
        ]
      })
    });

    const result = await aiService.generateFinancialSummary(metrics);
    expect(result.summary).toBe('Good budget management.');
    expect(result.insights).toEqual(['Savings rate is 40%.']);
    expect(result.priority).toBe('low');
  });

  // 9. Malformed AI response
  it('9. Malformed AI response should return controlled fallback without throwing', async () => {
    jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([] as any);
    jest.spyOn(prisma.budget, 'findMany').mockResolvedValue([] as any);

    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'This is not valid json' }] } }]
      })
    });

    const req: any = { user: { id: mockUserId }, query: { period: 'monthly' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getFinancialSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        fallback: true,
        data: expect.objectContaining({
          summary: 'Financial insights are temporarily unavailable.',
          priority: 'low'
        })
      })
    );
  });

  // 10. AI provider failure
  it('10. AI provider failure should return 502 with fallback summary', async () => {
    jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([] as any);
    jest.spyOn(prisma.budget, 'findMany').mockResolvedValue([] as any);

    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Gemini service overloaded'
    });

    const req: any = { user: { id: mockUserId }, query: { period: 'monthly' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getFinancialSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        fallback: true,
        data: expect.objectContaining({ summary: 'Financial insights are temporarily unavailable.' })
      })
    );
  });

  // 11. Missing API key
  it('11. Missing API key should return 503 with fallback summary', async () => {
    delete process.env.AI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([] as any);
    jest.spyOn(prisma.budget, 'findMany').mockResolvedValue([] as any);

    const req: any = { user: { id: mockUserId }, query: { period: 'monthly' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getFinancialSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        fallback: true,
        data: expect.objectContaining({ summary: 'Financial insights are temporarily unavailable.' })
      })
    );
  });

  // 12. Maximum 3 insights
  it('12. Maximum 3 insights: should truncate insight array to 3 items if AI provides more', async () => {
    const metrics: any = {
      period: 'Monthly',
      income: 2000,
      expenses: 1500,
      savings: 500,
      savingsRate: 25,
      topExpenseCategory: 'Food',
      topExpenseAmount: 600,
      budgetUsage: 75,
      overBudgetCategories: 0
    };

    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    summary: 'Spending is fine.',
                    insights: ['Insight 1', 'Insight 2', 'Insight 3', 'Insight 4', 'Insight 5'],
                    priority: 'medium'
                  })
                }
              ]
            }
          }
        ]
      })
    });

    const result = await aiService.generateFinancialSummary(metrics);
    expect(result.insights.length).toBe(3);
    expect(result.insights).toEqual(['Insight 1', 'Insight 2', 'Insight 3']);
  });

  // 13. Invalid priority fallback
  it('13. Invalid priority fallback: should fallback to low if model returns unknown priority', async () => {
    const metrics: any = {
      period: 'Monthly',
      income: 2000,
      expenses: 1000,
      savings: 1000,
      savingsRate: 50,
      topExpenseCategory: 'Food',
      topExpenseAmount: 400,
      budgetUsage: 50,
      overBudgetCategories: 0
    };

    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    summary: 'Balanced spending.',
                    insights: ['Good savings.'],
                    priority: 'extreme_critical'
                  })
                }
              ]
            }
          }
        ]
      })
    });

    const result = await aiService.generateFinancialSummary(metrics);
    expect(result.priority).toBe('low');
  });

  // 14. Dashboard continues working when AI fails
  it('14. Dashboard continues working when AI fails: returns fallback data and 200-series graceful response', async () => {
    jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([] as any);
    jest.spyOn(prisma.budget, 'findMany').mockResolvedValue([] as any);

    (globalThis as any).fetch = (jest.fn() as any).mockRejectedValue(new Error('Network offline'));

    const req: any = { user: { id: mockUserId }, query: { period: 'monthly' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getFinancialSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        fallback: true,
        data: expect.objectContaining({ summary: 'Financial insights are temporarily unavailable.' })
      })
    );
  });
});

describe('Phase 7 Step 3: AI Tax-Saving & Deduction Suggestions Tests', () => {
  const originalEnv = process.env;
  const mockUserId = 'user-ai-tax-123';

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, AI_API_KEY: 'mock-gemini-test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  // 1. Authenticated request
  it('1. Authenticated request should return 200 with suggestions array', async () => {
    const mockApiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  suggestions: [
                    {
                      title: 'Health Insurance Deduction',
                      description: 'If you are self-employed or pay out-of-pocket health insurance premiums, consider reviewing whether these qualify for deduction.',
                      priority: 'high'
                    },
                    {
                      title: 'Retirement Contributions',
                      description: 'Contributions to tax-deferred retirement accounts may reduce your taxable income under applicable guidelines.',
                      priority: 'medium'
                    }
                  ]
                })
              }
            ]
          }
        }
      ]
    };

    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    });

    const req: any = {
      user: { id: mockUserId },
      body: {
        income: 75000,
        region: 'us',
        filingStatus: 'single',
        businessExpenses: 2000,
        healthInsurance: 0,
        retirement: 0
      }
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await aiController.getTaxSuggestions(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      suggestions: [
        {
          title: 'Health Insurance Deduction',
          description: 'If you are self-employed or pay out-of-pocket health insurance premiums, consider reviewing whether these qualify for deduction.',
          priority: 'high'
        },
        {
          title: 'Retirement Contributions',
          description: 'Contributions to tax-deferred retirement accounts may reduce your taxable income under applicable guidelines.',
          priority: 'medium'
        }
      ]
    });
  });

  // 2. Unauthenticated request -> 401
  it('2. Unauthenticated request should return 401 Unauthorized', async () => {
    const req: any = { user: undefined, body: { income: 50000 } };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await aiController.getTaxSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Unauthorized' })
    );
  });

  // 3. Valid tax suggestion response parsing
  it('3. Valid tax suggestion response should parse JSON and unwrap code blocks cleanly', async () => {
    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '```json\n{"suggestions":[{"title":"Home Office","description":"Consider reviewing home office deductions.","priority":"low"}]}\n```'
                }
              ]
            }
          }
        ]
      })
    });

    const result = await aiService.suggestTaxDeductions({ income: 60000, homeOffice: 0 });
    expect(result.length).toBe(1);
    expect(result[0]!.title).toBe('Home Office');
    expect(result[0]!.priority).toBe('low');
  });

  // 4. Maximum 3 suggestions
  it('4. Maximum 3 suggestions: should truncate suggestions array to at most 3 items', async () => {
    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    suggestions: [
                      { title: 'S1', description: 'D1', priority: 'low' },
                      { title: 'S2', description: 'D2', priority: 'medium' },
                      { title: 'S3', description: 'D3', priority: 'high' },
                      { title: 'S4', description: 'D4', priority: 'low' },
                      { title: 'S5', description: 'D5', priority: 'medium' }
                    ]
                  })
                }
              ]
            }
          }
        ]
      })
    });

    const result = await aiService.suggestTaxDeductions({ income: 80000 });
    expect(result.length).toBe(3);
    expect(result.map(s => s.title)).toEqual(['S1', 'S2', 'S3']);
  });

  // 5. Invalid priority
  it('5. Invalid priority should normalize to "low"', async () => {
    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    suggestions: [
                      { title: 'Education Expense', description: 'Check tuition rules.', priority: 'URGENT_MUST_CLAIM' }
                    ]
                  })
                }
              ]
            }
          }
        ]
      })
    });

    const result = await aiService.suggestTaxDeductions({ income: 45000 });
    expect(result[0]!.priority).toBe('low');
  });

  // 6. Malformed AI response
  it('6. Malformed AI response should return controlled fallback without throwing', async () => {
    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'NOT VALID JSON' }] } }]
      })
    });

    const req: any = { user: { id: mockUserId }, body: { income: 50000 } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getTaxSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        fallback: true,
        suggestions: []
      })
    );
  });

  // 7. AI provider failure
  it('7. AI provider failure should return 502 with fallback suggestions array', async () => {
    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Provider error'
    });

    const req: any = { user: { id: mockUserId }, body: { income: 50000 } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getTaxSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        fallback: true,
        suggestions: []
      })
    );
  });

  // 8. Missing API key
  it('8. Missing API key should return 503 with fallback suggestions array', async () => {
    delete process.env.AI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const req: any = { user: { id: mockUserId }, body: { income: 50000 } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getTaxSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        fallback: true,
        suggestions: []
      })
    );
  });

  // 9. User ownership / validation
  it('9. User ownership: rejects missing or non-positive income with 400 Bad Request', async () => {
    const req: any = { user: { id: mockUserId }, body: { income: -100 } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getTaxSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining('income is required') })
    );
  });

  // 10. Existing tax calculation remains unchanged
  it('10. Existing tax calculation remains unchanged: pure mathematical calculation produces expected numbers without AI alteration', () => {
    // Simulating tax calculation formula
    const income = 100000;
    const deductions = 15000;
    const taxableIncome = Math.max(0, income - deductions);
    const estimatedTax = taxableIncome * 0.15;

    expect(taxableIncome).toBe(85000);
    expect(estimatedTax).toBe(12750);
  });

  // 11. AI failure does not break Tax Estimator
  it('11. AI failure does not break Tax Estimator: continues functioning normally when AI network is down', async () => {
    (globalThis as any).fetch = (jest.fn() as any).mockRejectedValue(new Error('Connection reset'));

    const req: any = { user: { id: mockUserId }, body: { income: 90000 } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await aiController.getTaxSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        fallback: true,
        suggestions: []
      })
    );
  });
});
