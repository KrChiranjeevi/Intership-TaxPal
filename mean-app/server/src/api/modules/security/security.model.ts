// src/modules/security/security.model.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// -------------------------
// MODEL FUNCTIONS
// -------------------------

// Change user's password
export const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error('Current password is incorrect');

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  return await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

// Toggle two-factor authentication
export const toggleTwoFactorAuth = async (userId: string, enabled: boolean) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: enabled },
  });
};
