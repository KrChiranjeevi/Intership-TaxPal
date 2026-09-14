import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AiCategorizationResponse {
  success: boolean;
  category: string;
  confidence: number;
  message?: string;
  fallback?: boolean;
}

export interface FinancialHealthSummary {
  summary: string;
  insights: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface FinancialHealthSummaryResponse {
  success: boolean;
  data: FinancialHealthSummary;
  fallback?: boolean;
  message?: string;
}

export interface TaxSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface TaxSuggestionRequest {
  income: number;
  region?: string;
  state?: string;
  quarter?: string;
  filingStatus?: string;
  businessExpenses?: number;
  retirement?: number;
  healthInsurance?: number;
  homeOffice?: number;
  additionalDeductions?: number;
}

export interface TaxSuggestionsResponse {
  success: boolean;
  suggestions: TaxSuggestion[];
  fallback?: boolean;
  message?: string;
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

  getFinancialSummary(period: string = 'monthly'): Observable<FinancialHealthSummaryResponse> {
    const params = new HttpParams().set('period', period);
    const { headers } = this.getAuthHeaders();

    return this.http.get<FinancialHealthSummaryResponse>(
      `${this.apiUrl}/financial-summary`,
      { headers, params }
    );
  }

  getTaxSuggestions(inputs: TaxSuggestionRequest): Observable<TaxSuggestionsResponse> {
    const payload: TaxSuggestionRequest = {
      income: inputs.income,
      region: inputs.region || undefined,
      state: inputs.state || undefined,
      quarter: inputs.quarter || undefined,
      filingStatus: inputs.filingStatus || undefined,
      businessExpenses: inputs.businessExpenses ?? 0,
      retirement: inputs.retirement ?? 0,
      healthInsurance: inputs.healthInsurance ?? 0,
      homeOffice: inputs.homeOffice ?? 0,
      additionalDeductions: inputs.additionalDeductions ?? 0
    };

    return this.http.post<TaxSuggestionsResponse>(
      `${this.apiUrl}/tax-suggestions`,
      payload,
      this.getAuthHeaders()
    );
  }
}
