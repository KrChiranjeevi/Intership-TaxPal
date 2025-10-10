import { Router } from 'express';
import * as taxController from './taxEstimator.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public route to perform a quick calculation
router.post('/calculate', taxController.calculateTaxHandler);

// All subsequent routes require a user to be authenticated
router.use(authMiddleware);

// Save a new tax estimate
router.post('/save', taxController.saveTaxEstimateHandler);

// Get all estimates for the logged-in user
router.get('/user', taxController.getUserTaxEstimatesHandler);

// Delete a specific tax estimate by its ID
router.delete('/:id', taxController.deleteTaxEstimateHandler);

export default router;
