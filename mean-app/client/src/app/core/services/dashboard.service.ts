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
}

