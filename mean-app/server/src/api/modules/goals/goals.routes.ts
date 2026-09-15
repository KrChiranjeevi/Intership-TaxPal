// src/api/modules/goals/goals.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as goalsController from './goals.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', goalsController.getGoals);
router.post('/', goalsController.createGoal);
router.put('/:id', goalsController.updateGoal);
router.patch('/:id/contribute', goalsController.contribute);
router.delete('/:id', goalsController.deleteGoal);

export default router;
