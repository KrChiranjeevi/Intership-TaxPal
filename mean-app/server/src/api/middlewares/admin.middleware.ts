// src/api/middlewares/admin.middleware.ts
import type { Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma.client.js';
import type { AuthRequest } from './auth.middleware.js';

export interface AdminRequest extends AuthRequest {
  userRecord?: any;
}

export async function adminMiddleware(req: AdminRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact an administrator.' });
    }

    const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const isBootstrapAdmin = adminEmail && user.email.toLowerCase() === adminEmail;
    const isAdmin = user.role === 'ADMIN' || isBootstrapAdmin;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Administrator privileges required.'
      });
    }

    // Auto-promote bootstrap admin if not already ADMIN
    if (isBootstrapAdmin && user.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      }).catch(console.error);
    }

    req.userRecord = user;
    next();
  } catch (err: any) {
    console.error('[AdminMiddleware] Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server authorization error' });
  }
}
