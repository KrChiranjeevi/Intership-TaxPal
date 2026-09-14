import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Transaction {
  id: string;
  userId?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string | Date;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionFilters {
  search?: string;
  type?: 'all' | 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TransactionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
}

export interface TransactionListResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    pagination: TransactionPagination;
    summary: TransactionSummary;
  };
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private api = environment.apiUrl + '/transactions';

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

  getTransactions(filters?: TransactionFilters): Observable<TransactionListResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.search && filters.search.trim()) {
        params = params.set('search', filters.search.trim());
      }
      if (filters.type && filters.type !== 'all') {
        params = params.set('type', filters.type);
      }
      if (filters.category && filters.category.trim() && filters.category.toLowerCase() !== 'all') {
        params = params.set('category', filters.category.trim());
      }
      if (filters.startDate) {
        params = params.set('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params = params.set('endDate', filters.endDate);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit) {
        params = params.set('limit', filters.limit.toString());
      }
    }

    const { headers } = this.getAuthHeaders();
    return this.http.get<TransactionListResponse>(this.api, { headers, params });
  }

  addIncome(payload: any): Observable<any> {
    return this.http.post<any>(
      this.api,
      { ...payload, type: 'income' },
      this.getAuthHeaders()
    );
  }

  addExpense(payload: any): Observable<any> {
    return this.http.post<any>(
      this.api,
      { ...payload, type: 'expense' },
      this.getAuthHeaders()
    );
  }

  updateTransaction(id: string, payload: Partial<Transaction>): Observable<{ success: boolean; data: Transaction }> {
    return this.http.put<{ success: boolean; data: Transaction }>(
      `${this.api}/${id}`,
      payload,
      this.getAuthHeaders()
    );
  }

  deleteTransaction(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/${id}`, this.getAuthHeaders());
  }
}
