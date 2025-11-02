// budget.model.ts
export interface Budget {
  id: string;             // Prisma uses UUID (string), not number
  category: string;
  amount: number;
  spent: number;
  month: Date;
  description?: string | undefined | null;
  userId: string;         // also UUID string
  createdAt?: Date;       // optional, Prisma sets it automatically
  updatedAt?: Date;       // optional, Prisma sets it automatically
}