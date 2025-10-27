
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
      type: data.type,       // 'income' or 'expense'
      color: data.color || '#2563eb', // default color if none provided
      userId,
    },
  });
}

export async function updateCategory(
  id: string,
  userId: string,
  data: Partial<CategoryDto>
) {
  // Only include properties that are defined
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.type !== undefined) updateData.type = data.type;

  return prisma.category.updateMany({
    where: { id, userId },
    data: updateData,
  });
}


export async function deleteCategory(id: string, userId: string) {
  return prisma.category.deleteMany({
    where: { id, userId },
  });
}
