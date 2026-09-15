import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type DashboardPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface DashboardSummary {
  monthlyIncome: number;
  periodIncome: number;
  monthlyExpenses: number;
  periodExpenses: number;
  netBalance: number;
  estimatedTax: number;
  savingsRate: number;
  totalTransactions: number;
  period?: DashboardPeriod;
  periodLabel?: string;
}

export interface MonthlyChartPoint {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
}

export interface DashboardTransaction {
  id: string;
  name: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  incomeVsExpenses: MonthlyChartPoint[];
  expenseBreakdown: CategoryExpense[];
  recentTransactions: DashboardTransaction[];
  periodTotalTransactions?: number;
  allTimeTotalTransactions: number;
  period?: DashboardPeriod;
  periodLabel?: string;
  totalIncome?: number;
  totalExpenses?: number;
  netBalance?: number;
  estimatedTax?: number;
  savingsRate?: string | number;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  message?: string;
}

// Advanced Analytics types
export interface TrendPoint {
  month: string;
  value: number;
  change: number | null;
}

export interface CashFlowPoint {
  month: string;
  value: number;
  positive: boolean;
}

export interface SavingsTrendPoint {
  month: string;
  value: number;
}

export interface QuarterlyPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface YearlyComparison {
  current: { year: number; income: number; expense: number };
  prior: { year: number; income: number; expense: number };
  incomeGrowth: number | null;
  expenseGrowth: number | null;
}

export interface MonthlyComparison {
  month: string;
  currentIncome: number;
  currentExpense: number;
  priorIncome: number;
  priorExpense: number;
}

export interface TopCategory {
  category: string;
  amount: number;
}

export interface BiggestExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface IncomeSource {
  source: string;
  amount: number;
}

export interface Prediction {
  nextMonthExpense: number;
  nextMonthIncome: number;
  projectedSavings: number;
}

export interface AdvancedAnalytics {
  incomeTrend: TrendPoint[];
  expenseTrend: TrendPoint[];
  cashFlow: CashFlowPoint[];
  savingsTrend: SavingsTrendPoint[];
  categoryGrowth: Record<string, number>;
  monthlyComparison: MonthlyComparison[];
  quarterlyComparison: QuarterlyPoint[];
  yearlyComparison: YearlyComparison;
  topCategories: TopCategory[];
  biggestExpense: BiggestExpense | null;
  highestIncomeSource: IncomeSource | null;
  averageDailySpending: number;
  prediction: Prediction;
  year: number;
}

export interface AnalyticsResponse {
  success: boolean;
  data: AdvancedAnalytics;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardSummary(period: DashboardPeriod = 'monthly', year?: number, month?: number): Observable<DashboardResponse> {
    let params = new HttpParams().set('period', period);
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());

    return this.http.get<DashboardResponse>(this.apiUrl, { params });
  }

  getAdvancedAnalytics(year?: number): Observable<AnalyticsResponse> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    return this.http.get<AnalyticsResponse>(`${this.apiUrl}/analytics`, { params });
  }
}
