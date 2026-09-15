// src/modules/users/users.routes.ts
import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  refreshTokenHandler,
  logoutHandler,
  getProfileHandler,
  updateProfileHandler,
  changePasswordHandler,
  exportDataHandler,
  deleteAccountHandler,
  requestPasswordResetHandler,
  resetPasswordHandler,
} from './user.controller.js';

import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimit.middleware.js';

const router = Router();

// Register & Login (Rate-limited)
router.post('/register', authLimiter, registerHandler);
router.post('/login', authLimiter, loginHandler);

// Refresh & Logout
router.post('/refresh-token', refreshTokenHandler);
router.post('/logout', logoutHandler);

// Profile & Account (JWT protected)
router.get('/me', authMiddleware, getProfileHandler);
router.get('/profile', authMiddleware, getProfileHandler);
router.put('/profile', authMiddleware, updateProfileHandler);
router.post('/change-password', authMiddleware, changePasswordHandler);
router.post('/export-data', authMiddleware, exportDataHandler);
router.delete('/account', authMiddleware, deleteAccountHandler);

// Password reset (Rate-limited)
router.post('/forgot-password', authLimiter, requestPasswordResetHandler);
router.post('/reset-password', authLimiter, resetPasswordHandler);


export default router;
