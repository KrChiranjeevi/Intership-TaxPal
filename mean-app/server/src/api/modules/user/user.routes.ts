// src/modules/users/users.routes.ts
import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  refreshTokenHandler,
  logoutHandler,
  getProfileHandler,
  requestPasswordResetHandler,
  resetPasswordHandler,
} from './user.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// Register & Login
router.post('/register', registerHandler);
router.post('/login', loginHandler);

// Refresh & Logout
router.post('/refresh-token', refreshTokenHandler);
router.post('/logout', logoutHandler);

// Get profile (JWT protected)
router.get('/me', authMiddleware, getProfileHandler);

// Password reset
router.post('/password-reset-request', requestPasswordResetHandler);
router.post('/password-reset', resetPasswordHandler);

export default router;
