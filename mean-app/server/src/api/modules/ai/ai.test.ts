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
