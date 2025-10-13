// src/modules/security/security.controller.ts
import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as securityService from './security.service.js';

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
    }

    await securityService.changePassword(userId, oldPassword, newPassword);
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const toggleTwoFactor = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { enabled } = req.body;
    if (enabled === undefined) return res.status(400).json({ success: false, message: 'Enabled value required' });

    const user = await securityService.toggleTwoFactorAuth(userId, enabled);
    res.status(200).json({ success: true, message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`, data: { twoFactorEnabled: user.twoFactorEnabled } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
