import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private api = environment.apiUrl + '/transactions';

  constructor(private http: HttpClient) {}

  // For now stub out with dummy data to avoid backend errors
  getDashboardData(): Observable<any> {
    // replace with: return this.http.get(`${this.api}/dashboard`);
    return of({
      income: 420,
      expense: 0,
      taxDue: 0,
      savingsRate: 100,
      months: ['Jan','Feb','Mar','Apr'],
      incomeSeries: [420,120,260,330],
      expenseSeries: [100,200,130,90],
      expenseLabels: ['Rent','Food','Travel','Other'],
      expensePercent: [32,28,16,24]
    });
  }

  addIncome(payload: any) {
    // return this.http.post(`${this.api}/income`, payload);
    return of({ ok: true });
  }

  addExpense(payload: any) {
    // return this.http.post(`${this.api}/expense`, payload);
    return of({ ok: true });
  }
}
