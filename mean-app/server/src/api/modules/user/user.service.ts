// src/modules/users/users.service.ts
import { prisma } from '../../../config/prisma.client.js';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import type { RegisterDto, LoginDto, RequestPasswordResetDto, ResetPasswordDto } from './user.model.js';
import crypto from 'crypto';

// ------------------- USER CRUD -------------------

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async createUser(data: any) {
    return this.prisma.user.create({ data });
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}


export async function createUser(data: RegisterDto) {
  const hashed = await bcrypt.hash(data.password, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
  const user = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username ?? null,
      email: data.email,
      password: hashed,
      country: data.country ?? null,
      incomeBracket: data.incomeBracket ?? null,
    },
  });
  const { password, ...rest } = user;
  return rest;
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function updateUserProfile(
  id: string,
  data: {
    name?: string;
    username?: string;
    country?: string | null;
    incomeBracket?: string | null;
    phone?: string | null;
    currency?: string | null;
    timezone?: string | null;
    language?: string | null;
    theme?: string | null;
    avatarUrl?: string | null;
    taxRegion?: string | null;
    twoFactorEnabled?: boolean;
  }
) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.username !== undefined && { username: data.username }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.incomeBracket !== undefined && { incomeBracket: data.incomeBracket }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.timezone !== undefined && { timezone: data.timezone }),
      ...(data.language !== undefined && { language: data.language }),
      ...(data.theme !== undefined && { theme: data.theme }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.taxRegion !== undefined && { taxRegion: data.taxRegion }),
      ...(data.twoFactorEnabled !== undefined && { twoFactorEnabled: Boolean(data.twoFactorEnabled) }),
    },
  });
  const { password, ...rest } = user;
  return rest;
}


export async function validateUser(data: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (!user) return null;

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) return null;

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && user.email.toLowerCase() === adminEmail && user.role !== 'ADMIN') {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    }).catch(console.error);
    user.role = 'ADMIN';
  }

  return user;
}


// ------------------- TOKEN HASHING HELPER -------------------

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ------------------- REFRESH TOKEN -------------------

export async function saveRefreshToken(userId: string, token: string, expiresAt: Date) {
  const tokenHash = hashToken(token);
  return prisma.refreshToken.create({
    data: { tokenHash, userId, expiresAt },
  });
}

export async function findUserByRefreshToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
  return record?.user ?? null;
}

export async function removeRefreshToken(token: string) {
  const tokenHash = hashToken(token);
  return prisma.refreshToken.deleteMany({ where: { tokenHash } });
}


// ------------------- PASSWORD RESET -------------------

// Fallback in-memory map if DB table is unmigrated in dev
const memoryResetFallback: Record<string, { tokenHash: string; userId: string; expiresAt: Date; used: boolean }> = {};

/**
 * Generates a crypto-secure random token, stores its SHA-256 hash in the database, and returns the raw token.
 * Token expiry is 15 minutes by default.
 */
export async function requestPasswordReset(data: RequestPasswordResetDto): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (!user) return null;

  // Generate cryptographically strong random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(resetToken);
  const expiresInMs = (Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? 15) || 15) * 60 * 1000;
  const expiresAt = new Date(Date.now() + expiresInMs);

  try {
    // Invalidate previous unused reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Create new token record in database
    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
        used: false,
      },
    });
  } catch (dbErr) {
    // Graceful fallback for local development if migrations haven't run
    memoryResetFallback[user.id] = { tokenHash, userId: user.id, expiresAt, used: false };
  }

  return resetToken;
}

/**
 * Validate token hash and set new password. Token must match, not be expired, and not be used.
 */
export async function saveNewPassword(data: ResetPasswordDto) {
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (!user) return null;

  const tokenHash = hashToken(data.token);
  let isValid = false;

  try {
    const record = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        tokenHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (record) {
      isValid = true;
      // Mark as used immediately (single-use enforcement)
      await prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { used: true },
      });
    }
  } catch (dbErr) {
    // Check fallback
    const mem = memoryResetFallback[user.id];
    if (mem && mem.tokenHash === tokenHash && !mem.used && mem.expiresAt > new Date()) {
      isValid = true;
      mem.used = true;
    }
  }

  if (!isValid) return null;

  const hashed = await bcrypt.hash(data.newPassword, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  const { password, ...rest } = updated;
  return rest;
}

/**
 * Changes password verifying the user's current password first.
 */
export async function changePassword(userId: string, currentPass: string, newPass: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const matches = await bcrypt.compare(currentPass, user.password);
  if (!matches) {
    throw new Error('Current password does not match');
  }

  const hashed = await bcrypt.hash(newPass, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return true;
}

/**
 * Exports all user data across all tables into a structured export object.
 */
export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      country: true,
      incomeBracket: true,
      phone: true,
      currency: true,
      timezone: true,
      language: true,
      theme: true,
      twoFactorEnabled: true,
      createdAt: true,
      transactions: {
        select: { id: true, type: true, amount: true, category: true, description: true, date: true, notes: true }
      },
      budgets: {
        select: { id: true, category: true, amount: true, spent: true, month: true, description: true }
      },
      categories: {
        select: { id: true, name: true, type: true, color: true }
      },
      goals: {
        select: { id: true, name: true, targetAmount: true, currentAmount: true, category: true, deadline: true, completed: true }
      },
      recurringTransactions: {
        select: { id: true, title: true, amount: true, category: true, type: true, frequency: true, nextRun: true, status: true }
      },
      taxEstimates: true,
      reports: {
        select: { id: true, reportType: true, period: true, format: true, generatedAt: true }
      }
    }
  });

  return {
    exportDate: new Date().toISOString(),
    version: '1.0',
    platform: 'TaxPal',
    userData: user
  };
}

/**
 * Permanently deletes user account and cleans up all related records.
 */
export async function deleteUserAccount(userId: string) {
  // Cascading deletes for user relations
  await prisma.notification.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.goal.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.recurringTransaction.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.transaction.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.budget.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.category.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.taxEstimate.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.report.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.refreshToken.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.passwordResetToken.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.userNotificationSetting.deleteMany({ where: { userId } }).catch(() => {});

  return await prisma.user.delete({
    where: { id: userId }
  });
}

