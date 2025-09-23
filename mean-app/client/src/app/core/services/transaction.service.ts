import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private api = environment.apiUrl + '/transactions';

  constructor(private http: HttpClient) {}

  // Helper to get headers with JWT token
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token'); // ensure token is stored on login
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      })
    };
  }

  getTransactions(): Observable<any> {
    return this.http.get<any>(this.api, this.getAuthHeaders());
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
}
