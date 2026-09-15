// src/api/modules/user/user.service.test.ts
import { jest } from '@jest/globals';
import { prisma } from '../../../config/prisma.client.js';
import { createUser } from './user.service.js';

describe('User Service Tests', () => {
  const testEmail = 'test@example.com';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create a new user and never return password in response', async () => {
    const mockUserRecord = {
      id: 'mock-user-id-123',
      name: 'Test User',
      email: testEmail,
      password: '$2b$10$mockHashedPasswordString',
      username: 'testuser',
      country: 'US',
      incomeBracket: 'medium',
      createdAt: new Date(),
      role: 'USER',
      isActive: true,
    };

    jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUserRecord as any);

    const result = await createUser({
      name: 'Test User',
      email: testEmail,
      password: 'plainPassword123!',
      username: 'testuser',
      country: 'US',
      incomeBracket: 'medium'
    });

    expect(result).toHaveProperty('id', 'mock-user-id-123');
    expect(result.email).toBe(testEmail);
    expect(result).not.toHaveProperty('password');
  });

  it('should fail if email already exists', async () => {
    const error = new Error('Unique constraint failed on the fields: (`email`)');
    jest.spyOn(prisma.user, 'create').mockRejectedValue(error as any);

    await expect(createUser({
      name: 'Duplicate',
      email: testEmail,
      password: 'password123'
    })).rejects.toThrow('Unique constraint failed');
  });
});
