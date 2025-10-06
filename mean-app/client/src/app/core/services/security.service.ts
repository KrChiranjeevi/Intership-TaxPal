import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SecurityService {
  private apiUrl = `${environment.apiUrl}/security`;

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

  // Change password
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/change-password`,
      { oldPassword, newPassword },
      this.getAuthHeaders()
    );
  }

  // Enable/disable two-factor authentication
  toggleTwoFactorAuth(enable: boolean): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/two-factor`,
      { enabled: enable },
      this.getAuthHeaders()
    );
  }
}
