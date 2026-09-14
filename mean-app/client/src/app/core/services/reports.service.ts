import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  transactionCount: number;
  largestExpense: number;
  topSpendingCategory: string;
}

export interface ReportTransaction {
  id: string;
  date: string | Date;
  description: string;
  category: string;
  type: string;
  amount: number;
}

export interface ReportPreviewResponse {
  success: boolean;
  summary: ReportSummary;
  transactions: ReportTransaction[];
}

export interface ReportFilters {
  period?: string;
  startDate?: string;
  endDate?: string;
  type?: 'all' | 'income' | 'expense';
  category?: string;
}

export interface Report {
  filePath: string;
  id: string;
  name: string;
  createdAt: string;
  period: string;
  reportType?: string;
  format: string;
  fileUrl?: string;
  summary?: ReportSummary;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

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

  getReports(): Observable<Report[]> {
    return this.http.get<Report[]>(this.apiUrl, this.getAuthHeaders());
  }

  getReportPreview(filters: ReportFilters): Observable<ReportPreviewResponse> {
    let params = new HttpParams();
    if (filters.period) params = params.set('period', filters.period);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.type && filters.type !== 'all') params = params.set('type', filters.type);
    if (filters.category && filters.category.trim()) params = params.set('category', filters.category.trim());

    return this.http.get<ReportPreviewResponse>(`${this.apiUrl}/preview`, {
      ...this.getAuthHeaders(),
      params
    });
  }

  createReport(data: Partial<Report> & ReportFilters): Observable<Report> {
    return this.http.post<Report>(this.apiUrl, data, this.getAuthHeaders());
  }

  updateReport(id: string, data: Partial<Report>): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}`, data, this.getAuthHeaders());
  }

  deleteReport(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  downloadReportFile(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob',
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token')}`
      })
    });
  }
}