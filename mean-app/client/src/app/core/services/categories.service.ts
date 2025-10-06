// client/src/app/services/categories.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  color?: string; // optional for category color
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  // Get all categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl, this.getAuthHeaders());
  }

  // Create category
  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category, this.getAuthHeaders());
  }

  // Update category
  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category, this.getAuthHeaders());
  }

  // Delete category
  deleteCategory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
