// src/api/modules/admin/admin.controller.ts
import type { Response } from 'express';
import type { AdminRequest } from '../../middlewares/admin.middleware.js';
import * as adminService from './admin.service.js';
import { prisma } from '../../../config/prisma.client.js';

export async function getAnalytics(req: AdminRequest, res: Response) {
  try {
    const data = await adminService.getPlatformAnalytics();
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('[AdminController] getAnalytics error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load platform analytics' });
  }
}

export async function getUsers(req: AdminRequest, res: Response) {
  try {
    const { page, limit, search, role, status } = req.query;
    const data = await adminService.getUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search ? String(search) : undefined,
      role: role ? String(role) : undefined,
      status: status ? String(status) : undefined,
    });
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('[AdminController] getUsers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
}

export async function updateUserStatus(req: AdminRequest, res: Response) {
  try {
    const id = req.params['id'];
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive (boolean) is required' });
    }

    // Prevent deactivating own account
    if (req.user?.id === id && !isActive) {
      return res.status(400).json({ success: false, message: 'Administrators cannot deactivate their own account.' });
    }

    // Protect other administrators from being deactivated
    const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (targetUser.role === 'ADMIN' && req.user?.id !== id) {
      return res.status(403).json({ success: false, message: 'Cannot deactivate another administrator account.' });
    }

    const updated = await adminService.setUserStatus(id, isActive);
    return res.status(200).json({ success: true, data: updated, message: `User account ${isActive ? 'activated' : 'deactivated'} successfully.` });
  } catch (err: any) {
    console.error('[AdminController] updateUserStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
}

export async function updateUserRole(req: AdminRequest, res: Response) {
  try {
    const id = req.params['id'];
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    const { role } = req.body;

    if (!role || !['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be either ADMIN or USER' });
    }

    if (req.user?.id === id && role !== 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot demote your own administrator privileges.' });
    }

    // Protect other administrators from having their role changed
    const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (targetUser.role === 'ADMIN' && req.user?.id !== id) {
      return res.status(403).json({ success: false, message: 'Cannot alter role of another administrator.' });
    }

    const updated = await adminService.setUserRole(id, role);
    return res.status(200).json({ success: true, data: updated, message: `User role updated to ${role}.` });
  } catch (err: any) {
    console.error('[AdminController] updateUserRole error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
}

export async function deleteUser(req: AdminRequest, res: Response) {
  try {
    const id = req.params['id'];
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (req.user?.id === id) {
      return res.status(400).json({ success: false, message: 'Administrators cannot delete their own account from admin portal.' });
    }

    // Protect other administrators from deletion
    const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (targetUser.role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Protected account: Cannot delete another administrator account.' });
    }

    await adminService.deleteUserAccount(id);
    return res.status(200).json({ success: true, message: 'User account and associated records deleted permanently.' });
  } catch (err: any) {
    console.error('[AdminController] deleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete user account' });
  }
}
