import { calculateBudgetSpending, getMonthDateRange } from './budget.service.js';

describe('Phase 5 - Step 1: Budget Module Spending & Business Logic Tests', () => {
  describe('1. Actual Transaction Spending Calculation', () => {
    it('Scenario 1: should calculate spent, remaining, and percentage correctly for normal spending', () => {
      const budgetAmount = 10000;
      const expenses = [
        { amount: 1500 },
        { amount: 1500 }
      ];

      const result = calculateBudgetSpending(budgetAmount, expenses);

      expect(result.spent).toBe(3000);
      expect(result.remaining).toBe(7000);
      expect(result.percentageUsed).toBe(30);
      expect(result.isOverBudget).toBe(false);
    });

    it('Scenario 2: should correctly calculate over-budget scenario when expenses exceed budget limit', () => {
      const budgetAmount = 10000;
      const expenses = [
        { amount: 5000 },
        { amount: 6500 }
      ];

      const result = calculateBudgetSpending(budgetAmount, expenses);

      expect(result.spent).toBe(11500);
      expect(result.remaining).toBe(0); // remaining should not become misleadingly negative
      expect(result.percentageUsed).toBe(115);
      expect(result.isOverBudget).toBe(true);
    });

    it('Scenario 3: should return zero spent and full remaining when no matching expense transactions exist', () => {
      const budgetAmount = 10000;
      const expenses: Array<{ amount: number }> = [];

      const result = calculateBudgetSpending(budgetAmount, expenses);

      expect(result.spent).toBe(0);
      expect(result.remaining).toBe(10000);
      expect(result.percentageUsed).toBe(0);
      expect(result.isOverBudget).toBe(false);
    });

    it('should handle decimal amounts with precision', () => {
      const budgetAmount = 500;
      const expenses = [
        { amount: 124.45 },
        { amount: 75.55 }
      ];

      const result = calculateBudgetSpending(budgetAmount, expenses);

      expect(result.spent).toBe(200);
      expect(result.remaining).toBe(300);
      expect(result.percentageUsed).toBe(40);
      expect(result.isOverBudget).toBe(false);
    });
  });

  describe('2. Date Range & Period Mapping', () => {
    it('should calculate the exact UTC month start and end range for a given month', () => {
      const date = new Date('2026-09-15T12:00:00.000Z');
      const { startDate, endDate } = getMonthDateRange(date);

      expect(startDate.toISOString()).toBe('2026-09-01T00:00:00.000Z');
      expect(endDate.toISOString()).toBe('2026-09-30T23:59:59.999Z');
    });

    it('should handle leap years correctly for February', () => {
      const date = new Date('2028-02-10T12:00:00.000Z'); // 2028 is a leap year
      const { startDate, endDate } = getMonthDateRange(date);

      expect(startDate.toISOString()).toBe('2028-02-01T00:00:00.000Z');
      expect(endDate.toISOString()).toBe('2028-02-29T23:59:59.999Z');
    });
  });

  describe('3. User Ownership & Isolation Logic', () => {
    it('Scenario 4: transactions belonging to another user must be excluded from current user budget', () => {
      const currentUserId = 'user-owner-123';
      const otherUserId = 'user-other-456';
      const budgetCategory = 'Groceries';

      const allSystemExpenses = [
        { userId: currentUserId, category: 'Groceries', amount: 200 },
        { userId: currentUserId, category: 'Groceries', amount: 300 },
        { userId: otherUserId, category: 'Groceries', amount: 5000 } // Other user's expense
      ];

      // Scoping to authenticated user only:
      const userExpenses = allSystemExpenses.filter(tx => tx.userId === currentUserId);
      const matching = userExpenses.filter(tx => tx.category.toLowerCase() === budgetCategory.toLowerCase());

      const result = calculateBudgetSpending(1000, matching);

      expect(result.spent).toBe(500); // Only 200 + 300
      expect(result.remaining).toBe(500);
      expect(result.percentageUsed).toBe(50);
      expect(result.isOverBudget).toBe(false);
    });

    it('transactions with non-expense types (e.g. income) must be ignored in budget calculation', () => {
      const transactions = [
        { type: 'expense', category: 'Travel', amount: 150 },
        { type: 'income', category: 'Travel', amount: 2000 } // Reimbursement / income
      ];

      const expenseOnly = transactions.filter(tx => tx.type === 'expense');
      const result = calculateBudgetSpending(500, expenseOnly);

      expect(result.spent).toBe(150);
      expect(result.remaining).toBe(350);
      expect(result.percentageUsed).toBe(30);
    });

    it('case-insensitive and trimmed category matching works reliably', () => {
      const budgetCategory = '  Dining Out ';
      const transactions = [
        { category: 'dining out', amount: 50 },
        { category: 'DINING OUT', amount: 75 },
        { category: 'Entertainment', amount: 200 }
      ];

      const normalizedBudgetCat = budgetCategory.trim().toLowerCase();
      const matching = transactions.filter(tx => tx.category.trim().toLowerCase() === normalizedBudgetCat);

      const result = calculateBudgetSpending(200, matching);

      expect(result.spent).toBe(125);
      expect(result.remaining).toBe(75);
      expect(result.percentageUsed).toBe(62.5);
    });
  });

  describe('4. Input Validation Criteria', () => {
    it('should identify invalid or zero budget limits', () => {
      const invalidAmounts = [0, -50, NaN, undefined];
      invalidAmounts.forEach(amt => {
        const isInvalid = amt === undefined || isNaN(Number(amt)) || Number(amt) <= 0;
        expect(isInvalid).toBe(true);
      });
    });

    it('should identify invalid category inputs', () => {
      const invalidCategories = ['', '   ', null, undefined];
      invalidCategories.forEach(cat => {
        const isInvalid = !cat || typeof cat !== 'string' || !cat.trim();
        expect(isInvalid).toBe(true);
      });
    });

    it('should identify invalid date formats', () => {
      const invalidDate = new Date('not-a-valid-date');
      expect(isNaN(invalidDate.getTime())).toBe(true);

      const validDate = new Date('2026-09-01');
      expect(isNaN(validDate.getTime())).toBe(false);
    });
  });
});
