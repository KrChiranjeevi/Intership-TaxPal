// src/api/modules/admin/admin.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { adminMiddleware } from '../../middlewares/admin.middleware.js';
import * as adminController from './admin.controller.js';

const router = Router();

// Protect all admin routes with JWT Auth + Admin Role Check
router.use(authMiddleware);
router.use(adminMiddleware);

// Analytics
router.get('/analytics', adminController.getAnalytics);

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

export default router;
