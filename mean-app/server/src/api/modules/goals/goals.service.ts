// src/api/modules/goals/goals.service.ts
import { prisma } from '../../../config/prisma.client.js';
import type { CreateGoalDto, UpdateGoalDto } from './goals.model.js';
import { createNotification } from '../notifications/notifications.service.js';

export async function getGoals(userId: string) {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { deadline: 'asc' }
  });

  // If user has no goals, seed initial realistic goals for demonstration
  if (goals.length === 0) {
    return await seedInitialGoals(userId);
  }

  return goals;
}

export async function createGoal(userId: string, data: CreateGoalDto) {
  const target = Number(data.targetAmount);
  const current = Number(data.currentAmount || 0);
  const completed = current >= target;

  return await prisma.goal.create({
    data: {
      userId,
      name: data.name.trim(),
      targetAmount: target,
      currentAmount: current,
      category: data.category?.trim() || 'General',
      deadline: new Date(data.deadline),
      completed,
      completedAt: completed ? new Date() : null
    }
  });
}

export async function updateGoal(userId: string, id: string, data: UpdateGoalDto) {
  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Goal not found');

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.targetAmount !== undefined) updateData.targetAmount = Number(data.targetAmount);
  if (data.currentAmount !== undefined) updateData.currentAmount = Number(data.currentAmount);
  if (data.category !== undefined) updateData.category = data.category.trim();
  if (data.deadline !== undefined) updateData.deadline = new Date(data.deadline);

  const target = updateData.targetAmount !== undefined ? updateData.targetAmount : existing.targetAmount;
  const current = updateData.currentAmount !== undefined ? updateData.currentAmount : existing.currentAmount;

  if (current >= target && !existing.completed) {
    updateData.completed = true;
    updateData.completedAt = new Date();

    // Trigger celebration notification
    await createNotification(userId, {
      title: 'Milestone Reached! 🎉',
      message: `Congratulations! You have reached 100% of your savings goal: "${existing.name}".`,
      type: 'goal_completed'
    });
  } else if (current < target) {
    updateData.completed = false;
    updateData.completedAt = null;
  }

  return await prisma.goal.update({
    where: { id },
    data: updateData
  });
}

export async function contributeToGoal(userId: string, id: string, amount: number) {
  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Goal not found');

  const deposit = Math.max(0, Number(amount));
  const newCurrent = existing.currentAmount + deposit;
  const isNowCompleted = newCurrent >= existing.targetAmount;

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      currentAmount: newCurrent,
      completed: isNowCompleted,
      completedAt: isNowCompleted && !existing.completed ? new Date() : existing.completedAt
    }
  });

  if (isNowCompleted && !existing.completed) {
    await createNotification(userId, {
      title: 'Goal Completed! 🏆',
      message: `Amazing achievement! You hit your target of $${existing.targetAmount.toLocaleString()} for "${existing.name}".`,
      type: 'goal_completed'
    });
  }

  return updated;
}

export async function deleteGoal(userId: string, id: string) {
  return await prisma.goal.deleteMany({
    where: { id, userId }
  });
}

async function seedInitialGoals(userId: string) {
  try {
    const seeds = [
      { name: 'Emergency Fund', targetAmount: 5000, currentAmount: 3200, category: 'Savings', deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) },
      { name: 'Buy Laptop', targetAmount: 1500, currentAmount: 950, category: 'Tech', deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
      { name: 'Vacation Trip', targetAmount: 2200, currentAmount: 1400, category: 'Travel', deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
    ];


    for (const s of seeds) {
      await prisma.goal.create({
        data: {
          userId,
          name: s.name,
          targetAmount: s.targetAmount,
          currentAmount: s.currentAmount,
          category: s.category,
          deadline: s.deadline,
          completed: false
        }
      });
    }

    return await prisma.goal.findMany({
      where: { userId },
      orderBy: { deadline: 'asc' }
    });
  } catch {
    return [];
  }
}
