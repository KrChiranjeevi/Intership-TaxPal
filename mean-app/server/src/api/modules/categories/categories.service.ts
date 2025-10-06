// src/modules/categories/categories.service.ts
import { prisma } from '../../../config/prisma.client.js';
import type { CategoryDto } from './categories.model.js';

export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCategory(userId: string, data: CategoryDto) {
  return prisma.category.create({
    data: {
      name: data.name,
      type: data.type,
      userId,
    },
  });
}

export async function updateCategory(id: string, userId: string, data: Partial<CategoryDto>) {
  return prisma.category.updateMany({
    where: { id, userId },
    data,
  });
}

export async function deleteCategory(id: string, userId: string) {
  return prisma.category.deleteMany({
    where: { id, userId },
  });
}
