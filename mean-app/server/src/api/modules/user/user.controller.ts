// src/modules/users/users.controller.ts
import type { Request, Response } from 'express';
import type { RegisterDto, LoginDto, RequestPasswordResetDto, ResetPasswordDto } from './user.model.js';
import {
  createUser,
  validateUser,
  findUserById,
  saveRefreshToken,
  removeRefreshToken,
  findUserByRefreshToken,
  requestPasswordReset,
  saveNewPassword,
  findUserByEmail,
} from './user.service.js';
import { generateAccessToken, generateRefreshToken } from '../../../utils/jwt.js';

// ------------------- REGISTER -------------------
export async function registerHandler(req: Request, res: Response) {
  try {
    const data: RegisterDto = req.body;
    if (!data.email || !data.password || !data.name || !data.username) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existing = await findUserByEmail(data.email);
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });

    const user = await createUser(data);
    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ------------------- LOGIN -------------------
export async function loginHandler(req: Request, res: Response) {
  try {
    const data: LoginDto = req.body;
    if (!data.email || !data.password) return res.status(400).json({ success: false, message: 'Missing email or password' });

    const user = await validateUser(data);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });
    await saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days

    const { password, ...rest } = user;
    return res.json({ success: true, data: { ...rest, accessToken, refreshToken } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ------------------- REFRESH TOKEN -------------------
export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'No token provided' });

    const user = await findUserByRefreshToken(refreshToken);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const accessToken = generateAccessToken({ userId: user.id });
    return res.json({ success: true, data: { accessToken } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ------------------- LOGOUT -------------------
export async function logoutHandler(req: Request, res: Response) {
  try {
    const {refreshToken} = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'No token provided' });

    await removeRefreshToken(refreshToken);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ------------------- GET PROFILE -------------------
export async function getProfileHandler(req: Request & { userId?: string }, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await findUserById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { password, ...rest } = user;
    return res.json({ success: true, data: rest });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ------------------- PASSWORD RESET -------------------
export async function requestPasswordResetHandler(req: Request, res: Response) {
  try {
    const data: RequestPasswordResetDto = req.body;
    if (!data?.email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const token = await requestPasswordReset(data);
    if (!token) return res.status(404).json({ success: false, message: 'User not found' });

    // --- Mock email sending: log link to console ---
    const frontendBase = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:4200';
    const resetPath = '/reset-password'; // make sure your frontend reset page listens for these query params
    const link = `${frontendBase}${resetPath}?email=${encodeURIComponent(data.email)}&token=${encodeURIComponent(token)}`;
    // --- Mock email content (with target="_self") ---
    const htmlEmail = `<p>Click the link below to reset your password:</p>
    <a href="${link}" target="_self">Reset Password</a>`;
    console.log(`\n[Mock Email] Password reset link for ${data.email}:\n${link}\n`);
    // (In real prod you'd send an email here)

    return res.json({ success: true, message: 'Password reset link generated and logged to server console (mock email).',link });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const data: ResetPasswordDto = req.body;
    if (!data?.email || !data?.token || !data?.newPassword) {
      return res.status(400).json({ success: false, message: 'Email, token and newPassword are required' });
    }

    const updated = await saveNewPassword(data);
    if (!updated) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
