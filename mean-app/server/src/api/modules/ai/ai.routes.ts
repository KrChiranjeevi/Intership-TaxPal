// src/api/modules/ai/ai.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { aiLimiter } from '../../middlewares/rateLimit.middleware.js';
import { categorizeTransaction, getFinancialSummary } from './ai.controller.js';

const router = Router();

// Endpoint for AI-assisted transaction categorization
router.post('/categorize-transaction', authMiddleware, aiLimiter, categorizeTransaction);

// Endpoint for AI-generated financial health summary
router.get('/financial-summary', authMiddleware, aiLimiter, getFinancialSummary);

export default router;
