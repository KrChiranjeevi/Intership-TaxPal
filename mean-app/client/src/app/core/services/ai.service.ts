import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AiCategorizationResponse {
  success: boolean;
  category: string;
  confidence: number;
  message?: string;
  fallback?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private apiUrl = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  suggestCategory(description: string, amount?: number, type?: string): Observable<AiCategorizationResponse> {
    const payload = {
      description,
      amount: amount ?? undefined,
      type: type ?? undefined
    };

    return this.http.post<AiCategorizationResponse>(
      `${this.apiUrl}/categorize-transaction`,
      payload,
      this.getAuthHeaders()
    );
  }
}
