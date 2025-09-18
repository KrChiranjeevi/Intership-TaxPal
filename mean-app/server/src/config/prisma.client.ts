import { PrismaClient } from '@prisma/client';

// Create a single shared Prisma client instance
export const prisma = new PrismaClient();
