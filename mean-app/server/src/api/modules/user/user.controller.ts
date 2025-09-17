import type { Request, Response } from 'express';
import { createUser, findUserByEmail, validateUser } from './user.service.js';
import { generateAccessToken, generateRefreshToken } from '../../../utils/jwt.js';

export async function registerHandler(req: Request, res: Response) {
  try {
    const { name, email, password, country } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const user = await createUser({ name, email, password, country });
    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ✅ NEW — login handler
export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Missing email or password' });
    }

    const user = await validateUser({ email, password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    const { password: _, ...rest } = user; // hide password
    return res.json({ success: true, data: { ...rest, accessToken, refreshToken } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
