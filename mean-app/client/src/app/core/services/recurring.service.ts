import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RecurringTransaction {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category?: string;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextRun: string;
  status: 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class RecurringService {
  private apiUrl = `${environment.apiUrl}/recurring-transactions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ success: boolean; data: RecurringTransaction[] }> {
    return this.getRecurring();
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

  getRecurring(): Observable<{ success: boolean; data: RecurringTransaction[] }> {
    const { headers } = this.getAuthHeaders();
    return this.http.get<{ success: boolean; data: RecurringTransaction[] }>(this.apiUrl, { headers });
  }

  createRecurring(data: Partial<RecurringTransaction>): Observable<{ success: boolean; data: RecurringTransaction }> {
    const { headers } = this.getAuthHeaders();
    return this.http.post<{ success: boolean; data: RecurringTransaction }>(this.apiUrl, data, { headers });
  }

  updateRecurring(id: string, data: Partial<RecurringTransaction>): Observable<any> {
    const { headers } = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/${id}`, data, { headers });
  }

  toggleStatus(id: string, status: 'active' | 'paused'): Observable<any> {
    const { headers } = this.getAuthHeaders();
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status }, { headers });
  }

  deleteRecurring(id: string): Observable<any> {
    const { headers } = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  processDue(): Observable<any> {
    const { headers } = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/process-due`, {}, { headers });
  }
}
