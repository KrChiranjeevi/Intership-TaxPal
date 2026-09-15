// src/api/modules/recurring/recurring.model.ts
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringStatus = 'active' | 'paused';

export interface CreateRecurringDto {
  title: string;
  amount: number;
  category?: string;
  type: 'income' | 'expense';
  frequency: RecurringFrequency;
  startDate?: string | Date;
}

export interface UpdateRecurringDto {
  title?: string;
  amount?: number;
  category?: string;
  type?: 'income' | 'expense';
  frequency?: RecurringFrequency;
  status?: RecurringStatus;
  nextRun?: string | Date;
}
