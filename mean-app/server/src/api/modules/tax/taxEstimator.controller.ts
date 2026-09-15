import type { Response, Request } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as taxService from './taxEstimator.service.js';
import type { TaxEstimateDto } from './taxEstimator.model.js';

/**
 * Public: Calculate tax without saving
 */
export function calculateTaxHandler(req: Request, res: Response) {
  try {
    const data = req.body as TaxEstimateDto;
    if (!data.income || data.income <= 0) {
      return res.status(400).json({ message: 'Income must be a positive number.' });
    }
    const result = taxService.calculateTax(data);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error calculating tax:', error);
    return res.status(500).json({ success: false, message: 'Error calculating tax' });
  }
}

/**
 * Authenticated: Save a new tax estimate
 */
export async function saveTaxEstimateHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const data = req.body as TaxEstimateDto;
    if (!data.income) {
      return res.status(400).json({ message: 'Income is required.' });
    }

    const savedEstimate = await taxService.saveTaxEstimate(userId, data);
    return res.status(201).json(savedEstimate); // frontend expects full object
  } catch (error) {
    console.error('Error saving tax estimate:', error);
    return res.status(500).json({ success: false, message: 'Error saving tax estimate' });
  }
}

/**
 * Authenticated: Get all tax estimates for logged-in user
 */
export async function getUserTaxEstimatesHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const estimates = await taxService.getTaxEstimatesByUserId(userId);
    return res.status(200).json(estimates);
  } catch (error) {
    console.error('Error fetching tax estimates:', error);
    return res.status(500).json({ success: false, message: 'Error fetching tax estimates' });
  }
}

export async function deleteTaxEstimateHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Tax estimate ID is required.' });

    await taxService.deleteTaxEstimate(id, userId);
    return res.status(200).json({ success: true, message: 'Tax estimate deleted successfully.' });
  } catch (error: any) {
    console.error('Delete tax estimate error:', error);
    if (error.message?.includes('not found') || error.message?.includes('not authorized')) {
      return res.status(404).json({ success: false, message: 'Tax estimate not found' });
    }
    return res.status(500).json({ success: false, message: 'Error deleting tax estimate' });
  }
}
