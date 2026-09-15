// src/api/modules/transactions/transaction.service.test.ts
import { jest } from '@jest/globals';
import { prisma } from '../../../config/prisma.client.js';
import { createTransaction, getAllTransactions, getTransactionById } from './transaction.service.js';

describe('Transaction Service Tests', () => {
  const mockUserId = 'mock-user-12345';
  const otherUserId = 'other-user-99999';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should add a new expense transaction with normalized fields', async () => {
    const mockTx = {
      id: 'tx-123',
      userId: mockUserId,
      type: 'expense',
      category: 'Food',
      description: 'Lunch with team',
      amount: 250,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      reportId: null
    };

    jest.spyOn(prisma.transaction, 'create').mockResolvedValue(mockTx as any);

    const result = await createTransaction({
      userId: mockUserId,
      type: 'expense',
      category: 'Food',
      description: 'Lunch with team',
      amount: 250,
      date: new Date(),
    });

    expect(result).toHaveProperty('id', 'tx-123');
    expect(result.amount).toBe(250);
    expect(result.userId).toBe(mockUserId);
  });

  it('should reject transactions with negative or zero amounts', async () => {
    await expect(createTransaction({
      userId: mockUserId,
      type: 'expense',
      category: 'Food',
      description: 'Zero amount',
      amount: 0,
      date: new Date(),
    })).rejects.toThrow('Amount must be a positive number greater than 0');
  });

  it('should enforce user data isolation when fetching transaction by id', async () => {
    // Transaction belongs to mockUserId
    const mockTx = {
      id: 'tx-secret-1',
      userId: mockUserId,
      type: 'income',
      amount: 5000,
      description: 'Salary',
      category: 'Income',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      reportId: null
    };

    // When querying for otherUserId, prisma returns null because userId does not match
    (jest.spyOn(prisma.transaction, 'findFirst') as any).mockImplementation((args: any) => {
      if (args.where.userId === mockUserId && args.where.id === 'tx-secret-1') {
        return Promise.resolve(mockTx);
      }
      return Promise.resolve(null);
    });

    // Authorized owner can access
    const ownerAccess = await getTransactionById('tx-secret-1', mockUserId);
    expect(ownerAccess.id).toBe('tx-secret-1');

    // Unauthorized user cannot access User A's transaction
    await expect(getTransactionById('tx-secret-1', otherUserId)).rejects.toThrow('Transaction not found or not authorized');
  });

  it('should fetch all transactions isolated to the authenticated user', async () => {
    const userTransactions = [
      { id: 'tx-1', userId: mockUserId, amount: 100, type: 'expense', description: 'Coffee' },
      { id: 'tx-2', userId: mockUserId, amount: 200, type: 'expense', description: 'Groceries' },
    ];

    jest.spyOn(prisma.transaction, 'count').mockResolvedValue(2 as any);
    jest.spyOn(prisma.transaction, 'findMany').mockResolvedValue(userTransactions as any);
    jest.spyOn(prisma.transaction, 'groupBy').mockResolvedValue([
      { type: 'expense', _sum: { amount: 300 } }
    ] as any);

    const result: any = await getAllTransactions(mockUserId);
    expect(result).toHaveProperty('transactions');
    expect(Array.isArray(result.transactions)).toBe(true);
    expect(result.transactions.length).toBe(2);
    expect(result.pagination.total).toBe(2);
  });
});
