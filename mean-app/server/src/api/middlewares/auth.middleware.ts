// import type { Request, Response, NextFunction } from 'express';
// import { verifyToken } from '../../utils/jwt.js';

// export interface AuthRequest extends Request {
//   user?: { id: string };
// }

// export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
//   try {
//     const authHeader = req.headers['authorization'];
//     if (!authHeader?.startsWith('Bearer '))
//       return res.status(401).json({ success: false, message: 'No token provided' });

//     const token = authHeader.split(' ')[1];
//     if (!token) return res.status(401).json({ success: false, message: 'Invalid token' });

//     const decoded = verifyToken(token);
//     if (!decoded) return res.status(401).json({ success: false, message: 'Invalid or expired token' });

//     req.user = { id: decoded.userId };
//     next();
//   } catch (err) {
//     console.error(err);
//     return res.status(401).json({ success: false, message: 'Invalid or expired token' });
//   }
// }


// server/src/api/middlewares/auth.middleware.ts

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type AuthRequest = Request & { user?: { id: string } };

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};