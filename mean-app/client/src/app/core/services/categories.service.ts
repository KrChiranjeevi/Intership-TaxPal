// client/src/app/services/categories.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
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
        Authorization: token ? `Bearer ${token}` : '',
      }),
    };
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<{ success: boolean; data: Category[] }>(
      this.apiUrl,
      this.getAuthHeaders()
    ).pipe(map(res => res.data));
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<{ success: boolean; data: Category }>(
      this.apiUrl,
      category,
      this.getAuthHeaders()
    ).pipe(map(res => res.data));
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<{ success: boolean; data: Category }>(
      `${this.apiUrl}/${id}`,
      category,
      this.getAuthHeaders()
    ).pipe(map(res => res.data));
  }

  deleteCategory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}`,
      this.getAuthHeaders()
    );
  }
}
