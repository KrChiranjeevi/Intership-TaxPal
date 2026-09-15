// src/modules/users/users.controller.ts
import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import type { RegisterDto, LoginDto, RequestPasswordResetDto, ResetPasswordDto } from './user.model.js';
import {
  createUser,
  validateUser,
  findUserById,
  updateUserProfile,
  saveRefreshToken,
  removeRefreshToken,
  findUserByRefreshToken,
  requestPasswordReset,
  saveNewPassword,
  findUserByEmail,
  changePassword,
  exportUserData,
  deleteUserAccount,
} from './user.service.js';

import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../../utils/jwt.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ------------------- REGISTER -------------------
export async function registerHandler(req: Request, res: Response) {
  try {
    const { name, username, email, password, country, incomeBracket }: RegisterDto = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }

    const user = await createUser({
      name: name.trim(),
      username: username.trim(),
      email: normalizedEmail,
      password,
      country: country ? String(country) : null,
      incomeBracket: incomeBracket ? String(incomeBracket) : null,
    });

    return res.status(201).json({ success: true, data: user });
  } catch (err: any) {
    console.error('Registration error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
}

// ------------------- LOGIN -------------------
export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password }: LoginDto = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    if (!EMAIL_REGEX.test(String(email).trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const user = await validateUser({ email: String(email).toLowerCase().trim(), password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });
    await saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days

    const { password: _p, ...rest } = user;
    return res.json({ success: true, data: { ...rest, accessToken, refreshToken } });
  } catch (err: any) {
    console.error('Login error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
}

// ------------------- REFRESH TOKEN -------------------
export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    // Verify JWT cryptographic signature with separate refresh secret
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Verify presence and validity in database (by SHA-256 hash)
    const user = await findUserByRefreshToken(refreshToken);
    if (!user || user.id !== decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid or revoked refresh token' });
    }

    const accessToken = generateAccessToken({ userId: user.id });
    return res.json({ success: true, data: { accessToken } });
  } catch (err: any) {
    console.error('Refresh token error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Server error during token refresh' });
  }
}

// ------------------- LOGOUT -------------------
export async function logoutHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken && typeof refreshToken === 'string') {
      await removeRefreshToken(refreshToken);
    }

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    console.error('Logout error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Server error during logout' });
  }
}

// ------------------- GET PROFILE -------------------
export async function getProfileHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { password, ...rest } = user;
    return res.json({ success: true, data: rest });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ------------------- UPDATE PROFILE -------------------
export async function updateProfileHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const updated = await updateUserProfile(userId, req.body);
    return res.json({ success: true, data: updated, message: 'Profile updated successfully' });
  } catch (err: any) {
    console.error('Update profile error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
}

// ------------------- CHANGE PASSWORD -------------------
export async function changePasswordHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    await changePassword(userId, currentPassword, newPassword);
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err?.message || 'Password update failed' });
  }
}

// ------------------- EXPORT DATA -------------------
export async function exportDataHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const exportBundle = await exportUserData(userId);
    return res.json({ success: true, data: exportBundle });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Export failed' });
  }
}

// ------------------- DELETE ACCOUNT -------------------
export async function deleteAccountHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await deleteUserAccount(userId);
    return res.json({ success: true, message: 'Account permanently deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Account deletion failed' });
  }
}


// ------------------- PASSWORD RESET -------------------
export async function requestPasswordResetHandler(req: Request, res: Response) {
  try {
    const { email } = req.body as RequestPasswordResetDto;
    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    const token = await requestPasswordReset({ email: email.toLowerCase().trim() });

    // Always respond with a generic success to prevent email enumeration attacks
    const responseData: any = {
      success: true,
      message: 'If an account matches that email, a password reset request has been processed.',
    };

    // In local development, provide the reset link in the response payload for easy testing without an email server
    if (process.env.NODE_ENV !== 'production' && token) {
      const frontendBase = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:4200';
      responseData.resetLink = `${frontendBase}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    }

    return res.json(responseData);
  } catch (err) {
    console.error('Password reset request error:', err);
    return res.status(500).json({ success: false, message: 'Server error processing password reset' });
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const { email, token, newPassword }: ResetPasswordDto = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, token, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const updated = await saveNewPassword({ email: email.toLowerCase().trim(), token, newPassword });
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Invalid, expired, or already used reset token' });
    }

    return res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
}
