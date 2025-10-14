import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/budgets`;

  constructor(private http: HttpClient) {}

  // Helper to get headers with JWT token
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      })
    };
  }

  // Create a new budget
  createBudget(budgetData: any): Observable<any> {
    return this.http.post(this.apiUrl, budgetData, this.getAuthHeaders());
  }

  // Get all budgets for the logged-in user
  getAllBudgets(): Observable<any> {
    return this.http.get(this.apiUrl, this.getAuthHeaders());
  }

  // Update a budget by id
  updateBudget(id: string, budgetData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, budgetData, this.getAuthHeaders());
  }

  // Delete a budget by id
  deleteBudget(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
