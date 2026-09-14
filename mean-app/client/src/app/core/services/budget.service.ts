import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  month: string | Date;
  description?: string | null | undefined;
  userId?: string | undefined;
  createdAt?: string | Date | undefined;
  updatedAt?: string | Date | undefined;
}

export interface BudgetApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/budgets`;

  constructor(private http: HttpClient) {}

  // Helper to get headers with JWT token
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  // Create a new budget
  createBudget(budgetData: {
    category: string;
    amount: number;
    month: string;
    description?: string | null;
  }): Observable<BudgetApiResponse<Budget>> {
    return this.http.post<BudgetApiResponse<Budget>>(this.apiUrl, budgetData, this.getAuthHeaders());
  }

  // Get all budgets for the logged-in user
  getAllBudgets(): Observable<BudgetApiResponse<Budget[]>> {
    return this.http.get<BudgetApiResponse<Budget[]>>(this.apiUrl, this.getAuthHeaders());
  }

  // Update a budget by id
  updateBudget(id: string, budgetData: {
    category?: string;
    amount?: number;
    month?: string;
    description?: string | null;
  }): Observable<BudgetApiResponse<Budget>> {
    return this.http.put<BudgetApiResponse<Budget>>(`${this.apiUrl}/${id}`, budgetData, this.getAuthHeaders());
  }

  // Delete a budget by id
  deleteBudget(id: string): Observable<BudgetApiResponse<Budget>> {
    return this.http.delete<BudgetApiResponse<Budget>>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}