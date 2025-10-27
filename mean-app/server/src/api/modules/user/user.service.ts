// src/modules/users/users.service.ts
import { prisma } from '../../../config/prisma.client.js';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import type { RegisterDto, LoginDto, RequestPasswordResetDto, ResetPasswordDto } from './user.model.js';

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

// Temporary in-memory store
const passwordResetTokens: Record<string, string> = {};

// Generate token
export async function requestPasswordReset(data: RequestPasswordResetDto) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return null;

  const resetToken = Math.random().toString(36).substring(2, 15);
  passwordResetTokens[data.email] = resetToken; // store token
  return resetToken;
}

// Update password only if token matches
export async function saveNewPassword(data: ResetPasswordDto) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return null;

  if (passwordResetTokens[data.email] !== data.token) return null; // token verification

  const hashed = await bcrypt.hash(data.newPassword, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
  const updated = await prisma.user.update({
    where: { email: data.email },
    data: { password: hashed },
  });

  delete passwordResetTokens[data.email]; // remove used token
  return updated;
}
