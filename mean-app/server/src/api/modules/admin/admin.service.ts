// src/api/modules/admin/admin.service.ts
import { prisma } from '../../../config/prisma.client.js';

export interface PaginationParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  role?: string | undefined;
  status?: string | undefined;
}

/**
 * Get comprehensive platform analytics for the admin dashboard.
 */
export async function getPlatformAnalytics() {
  try {
    const [
      totalUsers,
      activeUsers,
      totalTransactions,
      transactionAgg,
      totalReports,
      totalBudgets,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _avg: { amount: true }
      }),
      prisma.report.count().catch(() => 0),
      prisma.budget.count().catch(() => 0),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          country: true,
          _count: {
            select: { transactions: true }
          }
        }
      })
    ]);

    // Aggregate income vs expense totals
    const incomeAgg = await prisma.transaction.aggregate({
      where: { type: 'income' },
      _sum: { amount: true }
    });

    const expenseAgg = await prisma.transaction.aggregate({
      where: { type: 'expense' },
      _sum: { amount: true }
    });

    // Country breakdown
    const countryGroups = await prisma.user.groupBy({
      by: ['country'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 6
    }).catch(() => []);

    return {
      metrics: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalTransactions,
        totalVolume: transactionAgg._sum.amount || 0,
        averageTransaction: Math.round((transactionAgg._avg.amount || 0) * 100) / 100,
        totalIncomeVolume: incomeAgg._sum.amount || 0,
        totalExpenseVolume: expenseAgg._sum.amount || 0,
        totalReports,
        totalBudgets,
      },
      countryBreakdown: countryGroups.map(c => ({
        country: c.country || 'Global / Unspecified',
        count: c._count.id
      })),
      recentSignups: recentUsers
    };
  } catch (err: any) {
    console.error('[AdminService] getPlatformAnalytics error:', err);
    throw err;
  }
}

/**
 * Get paginated list of users with search and filtering.
 */
export async function getUsers(params: PaginationParams) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.search?.trim()) {
    const s = params.search.trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { username: { contains: s, mode: 'insensitive' } },
    ];
  }

  if (params.role) {
    where.role = params.role;
  }

  if (params.status === 'active') {
    where.isActive = true;
  } else if (params.status === 'inactive') {
    where.isActive = false;
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        country: true,
        currency: true,
        _count: {
          select: {
            transactions: true,
            budgets: true,
            reports: true
          }
        }
      }
    })
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Toggle user active status (deactivate or reactivate).
 */
export async function setUserStatus(userId: string, isActive: boolean) {
  return await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, name: true, email: true, isActive: true, role: true }
  });
}

/**
 * Update user role.
 */
export async function setUserRole(userId: string, role: string) {
  const validRole = role === 'ADMIN' ? 'ADMIN' : 'USER';
  return await prisma.user.update({
    where: { id: userId },
    data: { role: validRole },
    select: { id: true, name: true, email: true, role: true }
  });
}

/**
 * Permanently delete a user account and cascading data.
 */
export async function deleteUserAccount(userId: string) {
  // Delete related data first in transaction if foreign keys don't cascade
  return await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { userId } }).catch(() => {});
    await tx.budget.deleteMany({ where: { userId } }).catch(() => {});
    await tx.report.deleteMany({ where: { userId } }).catch(() => {});
    await tx.notification.deleteMany({ where: { userId } }).catch(() => {});
    await tx.userNotificationSetting.deleteMany({ where: { userId } }).catch(() => {});
    return await tx.user.delete({ where: { id: userId } });
  });
}
