// Represents the data needed for a calculation or to save an estimate
export interface TaxEstimateDto {
  country?: string;
  state?: string;
  status?: string;
  quarter?: string;
  year: number;
  income: number;
  businessExpenses?: number;
  retirement?: number;
  healthInsurance?: number;
  homeOffice?: number;
  additionalDeductions?: number;
}

// Represents the full TaxEstimate object as stored in the database
export interface TaxEstimate extends TaxEstimateDto {
  id: string;
  userId: string;
  taxableIncome: number;
  estimatedTax: number;
  effectiveTaxRate: number;
  createdAt: Date;
  updatedAt: Date;
}

