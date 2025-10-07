// src/modules/security/security.routes.ts
import { Router } from 'express';
import * as securityController from './security.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// All security routes are protected
router.use(authMiddleware);

router.post('/change-password', securityController.changePassword);
router.post('/two-factor', securityController.toggleTwoFactor);

export default router;
