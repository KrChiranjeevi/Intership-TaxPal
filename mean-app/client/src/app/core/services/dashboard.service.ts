import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  netBalance: number;
  estimatedTax: number;
  savingsRate: number;
  totalTransactions: number;
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
  allTimeTotalTransactions: number;
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

  getDashboardSummary(period?: string, year?: number, month?: number): Observable<DashboardResponse> {
    let params = new HttpParams();
    if (period) params = params.set('period', period);
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());

    return this.http.get<DashboardResponse>(this.apiUrl, { params });
  }
}
