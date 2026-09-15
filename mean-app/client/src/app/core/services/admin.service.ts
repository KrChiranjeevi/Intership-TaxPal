// src/app/core/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  country?: string;
  currency?: string;
  _count?: {
    transactions: number;
    budgets: number;
    reports: number;
  };
}

export interface PlatformAnalytics {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalTransactions: number;
    totalVolume: number;
    averageTransaction: number;
    totalIncomeVolume: number;
    totalExpenseVolume: number;
    totalReports: number;
    totalBudgets: number;
  };
  countryBreakdown: Array<{ country: string; count: number }>;
  recentSignups: AdminUser[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      })
    };
  }

  getAnalytics(): Observable<{ success: boolean; data: PlatformAnalytics }> {
    return this.http.get<{ success: boolean; data: PlatformAnalytics }>(
      `${this.apiUrl}/analytics`,
      this.getAuthHeaders()
    );
  }

  getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Observable<{
    success: boolean;
    data: {
      users: AdminUser[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.role) httpParams = httpParams.set('role', params.role);
    if (params?.status) httpParams = httpParams.set('status', params.status);

    const token = localStorage.getItem('token');
    return this.http.get<any>(`${this.apiUrl}/users`, {
      params: httpParams,
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      })
    });
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/users/${userId}/status`,
      { isActive },
      this.getAuthHeaders()
    );
  }

  updateUserRole(userId: string, role: 'ADMIN' | 'USER'): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/users/${userId}/role`,
      { role },
      this.getAuthHeaders()
    );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/users/${userId}`,
      this.getAuthHeaders()
    );
  }
}
