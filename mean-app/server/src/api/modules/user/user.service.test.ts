// src/api/modules/user/user.service.test.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('User Service Tests', () => {
  const testEmail = 'test@example.com';

  beforeAll(async () => {
    // delete children first to avoid FK constraint
    await prisma.refreshToken.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // cleanup
    await prisma.refreshToken.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should create a new user', async () => {
    const data = {
      name: 'Test User',
      email: testEmail,
      // Store a password that resembles hashed value OR hash it
      password: await bcrypt.hash('hashed123', 4),
    };

    const user = await prisma.user.create({ data });
    expect(user).toHaveProperty('id');
    expect(user.email).toBe(testEmail);
  });

  it('should fail if email already exists', async () => {
    const data = {
      name: 'Duplicate',
      email: testEmail, // same email as previous test
      password: await bcrypt.hash('12345', 4),
    };
    // creating again with same unique email should throw Prisma error
    await expect(prisma.user.create({ data })).rejects.toThrow();
  });
});
