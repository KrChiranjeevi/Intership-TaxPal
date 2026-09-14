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
  data: { name?: string; username?: string; country?: string; incomeBracket?: string }
) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.username !== undefined && { username: data.username }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.incomeBracket !== undefined && { incomeBracket: data.incomeBracket }),
    },
  });
  const { password, ...rest } = user;
  return rest;
}

export async function validateUser(data: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return null;

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) return null;

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
