// src/api/modules/ai/ai.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { aiLimiter } from '../../middlewares/rateLimit.middleware.js';
import { categorizeTransaction } from './ai.controller.js';

const router = Router();

// Endpoint for AI-assisted transaction categorization
router.post('/categorize-transaction', authMiddleware, aiLimiter, categorizeTransaction);

export default router;
