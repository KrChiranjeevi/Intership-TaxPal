// src/modules/categories/categories.model.ts
import { z } from 'zod';

export const CategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['income', 'expense']),
  color: z.string().optional(),
});

export type CategoryDto = z.infer<typeof CategorySchema>;
