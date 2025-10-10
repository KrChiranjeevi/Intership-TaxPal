import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as taxService from './taxEstimator.service.js';
import type { TaxEstimateDto } from './taxEstimator.model.js';


export function calculateTaxHandler(req: AuthRequest, res: Response) {
  try {
    const data = req.body as TaxEstimateDto;
    if (!data.income || data.income <= 0) {
      return res.status(400).json({ message: 'Income must be a positive number.' });
    }
    const result = taxService.calculateTax(data);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error calculating tax', error });
  }
}

/**
 * Handles the request to save a new tax estimate.
 */
export async function saveTaxEstimateHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const data = req.body as TaxEstimateDto;
    if (!data.income) {
      return res.status(400).json({ message: 'Income is a required field.' });
    }
    const savedEstimate = await taxService.saveTaxEstimate(userId, data);
    res.status(201).json({ message: 'Tax estimate saved successfully', data: savedEstimate });
  } catch (error) {
    res.status(500).json({ message: 'Error saving tax estimate', error });
  }
}

/**
 * Handles the request to get all tax estimates for the logged-in user.
 */
export async function getUserTaxEstimatesHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const estimates = await taxService.getTaxEstimatesByUserId(userId);
    res.status(200).json(estimates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tax estimates', error });
  }
}

/**
 * Handles the request to delete a specific tax estimate.
 */
export async function deleteTaxEstimateHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Tax Estimate ID is required.' });
    }
    // Optional: You could add a check here to ensure the user owns this estimate before deleting.
    await taxService.deleteTaxEstimate(id);
    res.status(200).json({ message: 'Tax estimate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tax estimate', error });
  }
}
