import { prisma } from '../../../config/prisma.client.js';
import bcrypt from 'bcrypt';
import type {RegisterDto } from './user.model.js';
import type {LoginDto } from './user.model.js';

export async function createUser(data: RegisterDto) {
  const hashed = await bcrypt.hash(data.password, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
  
  const user = await prisma.user.create({
    data: { 
      name: data.name, 
      email: data.email, 
      password: hashed, 
      country: data.country ?? null 
    },
  });

  // don’t expose password back to client
  const { password, ...rest } = user;
  return rest;
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function validateUser(data: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return null;

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) return null;

  return user;
}