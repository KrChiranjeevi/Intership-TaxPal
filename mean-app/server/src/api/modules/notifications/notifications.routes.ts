// src/modules/notifications/notifications.routes.ts
import { Router } from 'express';
import * as controller from './notifications.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware); // protect all routes

router.get('/', controller.getSettings);
router.put('/', controller.updateSettings);

export default router;
