import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/budgets`;

  constructor(private http: HttpClient) {}

  // create new budget - use POST to /api/budgets
  createBudget(budgetData: any): Observable<any> {
    return this.http.post(this.apiUrl, budgetData);
  }

  // get budgets
  getAllBudgets(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}
