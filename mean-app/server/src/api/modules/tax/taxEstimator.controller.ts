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
    console.error(error);
    return res.status(500).json({ message: 'Error calculating tax', error });
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
    console.error(error);
    return res.status(500).json({ message: 'Error saving tax estimate', error });
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
    console.error(error);
    return res.status(500).json({ message: 'Error fetching tax estimates', error });
  }
}

/**
 * Authenticated: Delete a tax estimate by ID
 */
export async function deleteTaxEstimateHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Tax estimate ID is required.' });

    await taxService.deleteTaxEstimate(id);
    return res.status(200).json({ message: 'Tax estimate deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error deleting tax estimate', error });
  }
}
