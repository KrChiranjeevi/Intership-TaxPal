// src/modules/users/users.routes.ts
import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  refreshTokenHandler,
  logoutHandler,
  getProfileHandler,
  updateProfileHandler,
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

// Profile (JWT protected)
router.get('/me', authMiddleware, getProfileHandler);
router.get('/profile', authMiddleware, getProfileHandler);
router.put('/profile', authMiddleware, updateProfileHandler);

// Password reset
router.post('/forgot-password', requestPasswordResetHandler);
router.post('/reset-password', resetPasswordHandler);

export default router;
