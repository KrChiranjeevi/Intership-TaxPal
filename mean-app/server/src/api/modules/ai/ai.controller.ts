// src/api/modules/ai/ai.controller.ts
import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import { prisma } from '../../../config/prisma.client.js';
import * as aiService from './ai.service.js';
import { DEFAULT_ALLOWED_CATEGORIES } from './ai.model.js';

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
