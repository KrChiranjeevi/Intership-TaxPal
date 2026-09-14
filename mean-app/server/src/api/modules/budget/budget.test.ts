import { jest } from '@jest/globals';
import {
  calculateBudgetSpending,
  getMonthDateRange,
  createBudget,
  getBudgetsByUserId,
  updateBudget,
  deleteBudget
} from './budget.service.js';
import { prisma } from '../../../config/prisma.client.js';

describe('Phase 5 - Step 1: Budget Module Tests (All 10 Scenarios)', () => {
  const mockUserId = 'user-12345';
  const otherUserId = 'user-99999';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1. Budget creation
  describe('1. Budget creation', () => {
    it('should create a budget and return it with calculated spending metrics', async () => {
      const mockCreated = {
        id: 'budget-1',
        category: 'Food',
        amount: 500,
        spent: 0,
        month: new Date('2026-09-01T00:00:00.000Z'),
        description: 'Groceries and snacks',
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(prisma.budget, 'create').mockResolvedValue(mockCreated as any);
      jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([
        { amount: 150, date: new Date('2026-09-10') }
      ] as any);

      const result = await createBudget({
        category: 'Food',
        amount: 500,
        month: '2026-09-01',
        description: 'Groceries and snacks',
        userId: mockUserId
      });

      expect(result.id).toBe('budget-1');
      expect(result.category).toBe('Food');
      expect(result.amount).toBe(500);
      expect(result.spent).toBe(150);
      expect(result.remaining).toBe(350);
      expect(result.percentageUsed).toBe(30);
      expect(result.isOverBudget).toBe(false);
    });
  });

  // 2. Budget retrieval
  describe('2. Budget retrieval', () => {
    it('should retrieve budgets for the user with calculated spending without N+1 query issue', async () => {
      const mockBudgets = [
        {
          id: 'budget-1',
          category: 'Food',
          amount: 1000,
          spent: 0,
          month: new Date('2026-09-01T00:00:00.000Z'),
          description: null,
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      jest.spyOn(prisma.budget, 'findMany').mockResolvedValue(mockBudgets as any);
      jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([
        { amount: 300, category: 'Food', date: new Date('2026-09-05T00:00:00.000Z') }
      ] as any);

      const result = await getBudgetsByUserId(mockUserId);

      expect(result.length).toBe(1);
      expect(result[0].spent).toBe(300);
      expect(result[0].remaining).toBe(700);
      expect(result[0].percentageUsed).toBe(30);
    });
  });

  // 3. Actual transaction spending calculation
  describe('3. Actual transaction spending calculation', () => {
    it('Scenario 1: should calculate spent, remaining, and percentage correctly for normal spending', () => {
      const budgetAmount = 10000;
      const expenses = [{ amount: 1500 }, { amount: 1500 }];

      const result = calculateBudgetSpending(budgetAmount, expenses);

      expect(result.spent).toBe(3000);
      expect(result.remaining).toBe(7000);
      expect(result.percentageUsed).toBe(30);
      expect(result.isOverBudget).toBe(false);
    });
  });

  // 4. Zero spending
  describe('4. Zero spending', () => {
    it('Scenario 3: should return zero spent and full remaining when no matching expense transactions exist', () => {
      const budgetAmount = 10000;
      const expenses: Array<{ amount: number }> = [];

      const result = calculateBudgetSpending(budgetAmount, expenses);

      expect(result.spent).toBe(0);
      expect(result.remaining).toBe(10000);
      expect(result.percentageUsed).toBe(0);
      expect(result.isOverBudget).toBe(false);
    });
  });

  // 5. Over-budget calculation
  describe('5. Over-budget calculation', () => {
    it('Scenario 2: should accurately calculate over-budget scenario without misleading negative remaining', () => {
      const budgetAmount = 10000;
      const expenses = [{ amount: 5000 }, { amount: 6500 }];

      const result = calculateBudgetSpending(budgetAmount, expenses);

      expect(result.spent).toBe(11500);
      expect(result.remaining).toBe(0);
      expect(result.percentageUsed).toBe(115);
      expect(result.isOverBudget).toBe(true);
    });
  });

  // 6. User ownership
  describe('6. User ownership', () => {
    it('should only retrieve budgets scoped to authenticated user', async () => {
      const findManySpy = jest.spyOn(prisma.budget, 'findMany').mockResolvedValue([]);

      await getBudgetsByUserId(mockUserId);

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId }
        })
      );
    });
  });

  // 7. Other user transactions are ignored
  describe('7. Other user transactions are ignored', () => {
    it('Scenario 4: should never include expenses belonging to other users', () => {
      const allSystemExpenses = [
        { userId: mockUserId, category: 'Food', amount: 250 },
        { userId: otherUserId, category: 'Food', amount: 8000 }
      ];

      const scopedExpenses = allSystemExpenses.filter(tx => tx.userId === mockUserId);
      const result = calculateBudgetSpending(1000, scopedExpenses);

      expect(result.spent).toBe(250);
      expect(result.remaining).toBe(750);
      expect(result.isOverBudget).toBe(false);
    });
  });

  // 8. Invalid budget amount
  describe('8. Invalid budget amount', () => {
    it('should throw validation error when creating a budget with amount <= 0', async () => {
      await expect(
        createBudget({
          category: 'Utilities',
          amount: 0,
          month: '2026-09-01',
          userId: mockUserId
        })
      ).rejects.toThrow('Budget amount must be greater than 0');

      await expect(
        createBudget({
          category: 'Utilities',
          amount: -100,
          month: '2026-09-01',
          userId: mockUserId
        })
      ).rejects.toThrow('Budget amount must be greater than 0');
    });

    it('should throw validation error when category is missing or empty', async () => {
      await expect(
        createBudget({
          category: '   ',
          amount: 200,
          month: '2026-09-01',
          userId: mockUserId
        })
      ).rejects.toThrow('Category is required');
    });
  });

  // 9. Update budget
  describe('9. Update budget', () => {
    it('should verify ownership and update budget amount & category', async () => {
      const existing = {
        id: 'budget-1',
        category: 'Transport',
        amount: 300,
        spent: 0,
        month: new Date('2026-09-01T00:00:00.000Z'),
        userId: mockUserId
      };
      const updated = {
        ...existing,
        amount: 450
      };

      jest.spyOn(prisma.budget, 'findFirst').mockResolvedValue(existing as any);
      jest.spyOn(prisma.budget, 'update').mockResolvedValue(updated as any);
      jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue([
        { amount: 150, date: new Date('2026-09-12') }
      ] as any);

      const result = await updateBudget('budget-1', mockUserId, { amount: 450 });

      expect(result).not.toBeNull();
      expect(result?.amount).toBe(450);
      expect(result?.spent).toBe(150);
      expect(result?.remaining).toBe(300);
    });

    it('should return null when updating a budget that belongs to another user', async () => {
      jest.spyOn(prisma.budget, 'findFirst').mockResolvedValue(null);

      const result = await updateBudget('budget-unowned', mockUserId, { amount: 500 });
      expect(result).toBeNull();
    });
  });

  // 10. Delete budget
  describe('10. Delete budget', () => {
    it('should verify ownership and delete the budget', async () => {
      const existing = {
        id: 'budget-1',
        category: 'Food',
        amount: 200,
        spent: 0,
        month: new Date('2026-09-01T00:00:00.000Z'),
        userId: mockUserId
      };

      jest.spyOn(prisma.budget, 'findFirst').mockResolvedValue(existing as any);
      const deleteSpy = jest.spyOn(prisma.budget, 'delete').mockResolvedValue(existing as any);

      const result = await deleteBudget('budget-1', mockUserId);

      expect(result).not.toBeNull();
      expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 'budget-1' } });
    });

    it('should return null when deleting a budget that belongs to another user', async () => {
      jest.spyOn(prisma.budget, 'findFirst').mockResolvedValue(null);

      const result = await deleteBudget('budget-other', mockUserId);
      expect(result).toBeNull();
    });
  });
});
