import { prisma } from '../../../config/prisma.client.js'; 
import type { TaxEstimate, TaxEstimateDto } from './taxEstimator.model.js';

/**
 * Performs a non-persistent tax calculation based on the provided data.
 * @param data - The input data for the tax calculation.
 * @returns The calculated tax details.
 */
export function calculateTax(data: TaxEstimateDto) {
  const totalDeductions =
    (data.businessExpenses ?? 0) +
    (data.retirement ?? 0) +
    (data.healthInsurance ?? 0) +
    (data.homeOffice ?? 0) +
    (data.additionalDeductions ?? 0);

  const taxableIncome = Math.max(0, data.income - totalDeductions);

  // Simple tax calculation using a 15% flat rate
  const estimatedTax = taxableIncome * 0.15;

  const effectiveTaxRate = data.income > 0 ? (estimatedTax / data.income) * 100 : 0;

  return {
    taxableIncome,
    estimatedTax,
    effectiveTaxRate: parseFloat(effectiveTaxRate.toFixed(2)),
    totalDeductions,
  };
}

/**
 * Saves a new tax estimate record for a user.
 * @param userId - The ID of the user saving the estimate.
 * @param data - The input data for the tax estimate.
 * @returns The saved tax estimate record.
 */
export async function saveTaxEstimate(userId: string, data: TaxEstimateDto): Promise<TaxEstimate> {
  const calculated = calculateTax(data);

  const newEstimate = await prisma.taxEstimate.create({
    data: {
      userId,
      country: data.country ?? 'United States',
      state: data.state ?? '',
      status: data.status ?? 'Single',
      quarter: data.quarter ?? 'Q1',
      year: data.year,
      income: data.income,
      businessExpenses: data.businessExpenses ?? 0,
      retirement: data.retirement ?? 0,
      healthInsurance: data.healthInsurance ?? 0,
      homeOffice: data.homeOffice ?? 0,
      additionalDeductions: data.additionalDeductions ?? 0,
      taxableIncome: calculated.taxableIncome,
      estimatedTax: calculated.estimatedTax,
      effectiveTaxRate: calculated.effectiveTaxRate,
    },
  });

  return newEstimate as TaxEstimate;
}

/**
 * Retrieves all tax estimates for a specific user.
 * @param userId - The ID of the user.
 * @returns A list of tax estimates.
 */
export async function getTaxEstimatesByUserId(userId: string): Promise<TaxEstimate[]> {
  return (await prisma.taxEstimate.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })) as TaxEstimate[];
}

/**
 * Deletes a specific tax estimate by its ID.
 * Ensures only the owner can delete their estimate.
 * @param id - The ID of the tax estimate to delete.
 * @param userId - The ID of the user attempting the deletion.
 */
export async function deleteTaxEstimate(id: string, userId?: string): Promise<void> {
  const existing = await prisma.taxEstimate.findUnique({ where: { id } });

  if (!existing) {
    throw new Error('Tax estimate not found.');
  }

  if (userId && existing.userId !== userId) {
    throw new Error('You are not authorized to delete this tax estimate.');
  }

  await prisma.taxEstimate.delete({
    where: { id },
  });
}
