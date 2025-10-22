import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TaxInputs {
  region: string;
  state: string;
  quarter: string;
  annualGrossIncome: number;
  filingStatus: string;
  businessExpenses?: number;
  retirement?: number;
  healthInsurance?: number;
  homeOffice?: number;
  additionalDeductions?: number;
}

export interface EstimatedTaxData {
  id?: string;
  userId?: string;
  country?: string;
  state?: string;
  status?: string;
  quarter?: string;
  year: number;
  income: number;
  businessExpenses?: number;
  retirement?: number;
  healthInsurance?: number;
  homeOffice?: number;
  additionalDeductions?: number;
  taxableIncome: number;
  estimatedTax: number;
  effectiveTaxRate: number;
  totalDeductions?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class TaxEstimatorService {
  private apiUrl = `${environment.apiUrl}/tax-estimator`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      })
    };
  }

  calculateTax(data: TaxInputs): Observable<EstimatedTaxData> {
    const body = {
      income: data.annualGrossIncome,
      country: data.region,
      state: data.state,
      status: data.filingStatus,
      quarter: data.quarter,
      year: new Date().getFullYear(),
      businessExpenses: data.businessExpenses,
      retirement: data.retirement,
      healthInsurance: data.healthInsurance,
      homeOffice: data.homeOffice,
      additionalDeductions: data.additionalDeductions
    };

    return this.http.post<EstimatedTaxData>(`${this.apiUrl}/calculate`, body);
  }

  saveTaxEstimate(data: TaxInputs): Observable<EstimatedTaxData> {
    const body = {
      income: data.annualGrossIncome,
      country: data.region,
      state: data.state,
      status: data.filingStatus,
      quarter: data.quarter,
      year: new Date().getFullYear(),
      businessExpenses: data.businessExpenses,
      retirement: data.retirement,
      healthInsurance: data.healthInsurance,
      homeOffice: data.homeOffice,
      additionalDeductions: data.additionalDeductions
    };

    return this.http.post<EstimatedTaxData>(`${this.apiUrl}/save`, body, this.getAuthHeaders());
  }

  getAllEstimates(): Observable<EstimatedTaxData[]> {
    return this.http.get<EstimatedTaxData[]>(`${this.apiUrl}/estimates`, this.getAuthHeaders());
  }

  deleteTaxEstimate(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
