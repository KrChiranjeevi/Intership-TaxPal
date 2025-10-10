import { PrismaClient } from '@prisma/client';
import type { TaxEstimate, TaxEstimateDto } from './taxEstimator.model.js';

const prisma = new PrismaClient();

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

  // Simple tax calculation using a 15% flat rate, as per the example logic
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
  // First, run the calculation logic
  const calculated = calculateTax(data);

  // Then, create the full record in the database
  const newEstimate = await prisma.taxEstimate.create({
    data: {
      userId,
      country: data.country,
      state: data.state,
      status: data.status,
      quarter: data.quarter,
      year: data.year,
      income: data.income,
      businessExpenses: data.businessExpenses,
      retirement: data.retirement,
      healthInsurance: data.healthInsurance,
      homeOffice: data.homeOffice,
      additionalDeductions: data.additionalDeductions,
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
 * @param id - The ID of the tax estimate to delete.
 */
export async function deleteTaxEstimate(id: string): Promise<void> {
  await prisma.taxEstimate.delete({
    where: { id },
  });
}
