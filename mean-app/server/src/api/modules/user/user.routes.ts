import { Router } from 'express';
import { registerHandler, loginHandler } from './user.controller.js';

const router = Router();

// POST /api/auth/register
router.post('/register', registerHandler);

// POST /api/auth/login
router.post('/login', loginHandler);

export default router;
