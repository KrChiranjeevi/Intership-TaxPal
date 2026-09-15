// src/api/modules/recurring/recurring.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as recurringController from './recurring.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', recurringController.getRecurring);
router.post('/', recurringController.createRecurring);
router.put('/:id', recurringController.updateRecurring);
router.patch('/:id/status', recurringController.toggleStatus);
router.delete('/:id', recurringController.deleteRecurring);
router.post('/process-due', recurringController.runProcess);

export default router;
