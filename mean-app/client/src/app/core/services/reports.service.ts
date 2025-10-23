import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Report {
  filePath: string;
  id: string;
  name: string;
  createdAt: string;
  period: string;
  format: string;
  fileUrl: string;
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

  getReports(accessToken?: any): Observable<Report[]> {
    return this.http.get<Report[]>(this.apiUrl, this.getAuthHeaders());
  }

  createReport(data: Partial<Report>, accessToken?: any): Observable<Report> {
    return this.http.post<Report>(this.apiUrl, data, this.getAuthHeaders());
  }
  updateReport(id: string, data: Partial<Report>): Observable<Report> {
  return this.http.put<Report>(`${this.apiUrl}/${id}`, data, this.getAuthHeaders());
  }
  deleteReport(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

}
