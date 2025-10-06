// budget.routes.ts
import { Router } from 'express';
import * as budgetController from './budget.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// All budget routes require authentication
router.use(authMiddleware);

router.post('/', budgetController.createBudget);
router.get('/', budgetController.getBudgets);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

export default router;