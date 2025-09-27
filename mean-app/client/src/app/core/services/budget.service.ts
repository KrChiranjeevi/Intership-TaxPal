import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/budgets`;

  constructor(private http: HttpClient) {}

  // Create a new budget
  createBudget(budgetData: any, userId: string): Observable<any> {
    return this.http.post(this.apiUrl, budgetData);
  }

  // Get all budgets for a specific user (pass userId as query)
  getAllBudgets(userId: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get(this.apiUrl, { params });
  }

  // Update a budget by id
  updateBudget(id: string, budgetData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, budgetData);
  }

  // Delete a budget by id
  deleteBudget(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
