import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private api = environment.apiUrl + '/transactions';

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}`);
  }

  addIncome(payload: any): Observable<any> {
    return this.http.post(`${this.api}/income`, payload);
  }

  addExpense(payload: any): Observable<any> {
    return this.http.post(`${this.api}/expense`, payload);
  }
}
