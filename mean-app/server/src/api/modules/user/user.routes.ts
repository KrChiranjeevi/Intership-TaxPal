import { Router } from 'express';
import { registerHandler } from './user.controller.js';

const router = Router();

// POST /api/auth/register
router.post('/register', registerHandler);

export default router;
