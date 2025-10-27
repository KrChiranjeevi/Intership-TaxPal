import { Router } from 'express';
import * as taxController from './taxEstimator.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public route: calculate tax without saving
router.post('/calculate', taxController.calculateTaxHandler);

// Authenticated routes
router.use(authMiddleware);

// Save a new tax estimate
router.post('/save', taxController.saveTaxEstimateHandler);

// Get all estimates for logged-in user
router.get('/estimates', taxController.getUserTaxEstimatesHandler);

// Delete a specific tax estimate by ID
router.delete('/:id', taxController.deleteTaxEstimateHandler);

export default router;
