// budget.routes.ts

import { Router } from 'express';
import * as budgetController from './budget.controller.js';

const router = Router();

// Define budget API routes

router.post('/', budgetController.createBudget);
router.get('/', budgetController.getBudgets);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

export default router;
