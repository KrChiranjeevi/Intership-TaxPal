import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  title?: string;
  targetAmount: number;
  currentAmount: number;
  category?: string;
  deadline: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  progressPercentage?: number;
  remainingAmount?: number;
  daysRemaining?: number;
  icon?: string;
  color?: string;
}

export type Goal = FinancialGoal;

@Injectable({ providedIn: 'root' })
export class GoalService {
  private apiUrl = `${environment.apiUrl}/goals`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ success: boolean; data: FinancialGoal[] }> {
    return this.getGoals();
  }

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  getGoals(): Observable<{ success: boolean; data: FinancialGoal[] }> {
    const { headers } = this.getAuthHeaders();
    return this.http.get<{ success: boolean; data: FinancialGoal[] }>(this.apiUrl, { headers });
  }

  createGoal(data: Partial<FinancialGoal>): Observable<{ success: boolean; data: FinancialGoal }> {
    const { headers } = this.getAuthHeaders();
    return this.http.post<{ success: boolean; data: FinancialGoal }>(this.apiUrl, data, { headers });
  }

  updateGoal(id: string, data: Partial<FinancialGoal>): Observable<{ success: boolean; data: FinancialGoal }> {
    const { headers } = this.getAuthHeaders();
    return this.http.put<{ success: boolean; data: FinancialGoal }>(`${this.apiUrl}/${id}`, data, { headers });
  }

  contribute(id: string, amount: number): Observable<{ success: boolean; data: FinancialGoal }> {
    const { headers } = this.getAuthHeaders();
    return this.http.patch<{ success: boolean; data: FinancialGoal }>(`${this.apiUrl}/${id}/contribute`, { amount }, { headers });
  }

  deleteGoal(id: string): Observable<any> {
    const { headers } = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}
