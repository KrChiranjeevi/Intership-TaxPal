// src/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string; // attach userId from verified token
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Verify token
    const decoded = jwt.verify(token, secret) as { userId: string };

    // Attach userId to request for protected routes
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
