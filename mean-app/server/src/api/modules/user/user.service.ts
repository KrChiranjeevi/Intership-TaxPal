// src/modules/users/users.service.ts
import { prisma } from '../../../config/prisma.client.js';
import bcrypt from 'bcrypt';
import type { RegisterDto, LoginDto, RequestPasswordResetDto, ResetPasswordDto } from './user.model.js';
import crypto from 'crypto';

// ------------------- USER CRUD -------------------

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

export async function validateUser(data: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return null;

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) return null;

  return user;
}

// ------------------- REFRESH TOKEN -------------------

export async function saveRefreshToken(userId: string, token: string, expiresAt: Date) {
  return prisma.refreshToken.create({
    data: { tokenHash: token, userId, expiresAt }, // save plain token for now
  });
}

export async function findUserByRefreshToken(token: string) {
  return prisma.refreshToken.findFirst({
    where: { tokenHash: token },
    include: { user: true },
  })?.then(t => t?.user ?? null);
}

export async function removeRefreshToken(token: string) {
  return prisma.refreshToken.deleteMany({ where: { tokenHash: token } });
}


// ------------------- PASSWORD RESET -------------------

// In-memory store: keyed by email -> { token, expiresAt }
type ResetRecord = { token: string; expiresAt: number };
const passwordResetTokens: Record<string, ResetRecord> = {};

/**
 * Generates a short random token, stores it with an expiry, and returns it.
 * Token expiry is 15 minutes by default.
 */
export async function requestPasswordReset(data: RequestPasswordResetDto) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return null;

  // create a cryptographically-strong token
  const resetToken = cryptoRandomToken(24); // ~24 chars
  const expiresInMs = (Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? 15) || 15) * 60 * 1000;
  const expiresAt = Date.now() + expiresInMs;

  passwordResetTokens[data.email] = { token: resetToken, expiresAt };

  return resetToken;
}

/**
 * Validate token and set new password. Token must match and not be expired.
 */
export async function saveNewPassword(data: ResetPasswordDto) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return null;

  const record = passwordResetTokens[data.email];
  if (!record) return null;
  if (record.token !== data.token) return null;
  if (Date.now() > record.expiresAt) {
    // expired
    delete passwordResetTokens[data.email];
    return null;
  }

  const hashed = await bcrypt.hash(data.newPassword, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
  const updated = await prisma.user.update({
    where: { email: data.email },
    data: { password: hashed },
  });

  // Remove token after use
  delete passwordResetTokens[data.email];
  return updated;
}

/** Helper: crypto-quality random token as hex */
function cryptoRandomToken(length = 24) {
  const bytes = Math.ceil(length / 2);
  return crypto.randomBytes(bytes).toString('hex').slice(0, length);
}
