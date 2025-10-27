// src/api/modules/transactions/transaction.service.test.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Transaction Service Tests', () => {
  let userId: string;

  beforeAll(async () => {
    // clean children first
    await prisma.refreshToken.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user and keep id for transactions
    const user = await prisma.user.create({
      data: {
        name: 'Tx Test User',
        email: `tx-test-${Date.now()}@example.com`,
        password: 'test-password', // OK for tests; in real app store hashed
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    // cleanup everything
    await prisma.transaction.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should add a new expense transaction', async () => {
    const newTx = {
      userId,
      type: 'expense',
      category: 'Food',
      description: 'Lunch',
      amount: 250,
      date: new Date(),
    };

    const tx = await prisma.transaction.create({ data: newTx });
    expect(tx).toHaveProperty('id');
    expect(tx.amount).toBe(250);
    expect(tx.userId).toBe(userId);
  });

  it('should fetch all transactions for a user', async () => {
    const list = await prisma.transaction.findMany({ where: { userId } });
    expect(Array.isArray(list)).toBe(true);
  });
});
