// client/src/app/services/notifications.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationSettings {
  emailNotifications: boolean;
  transactionAlerts: boolean;
  budgetWarnings: boolean;
  taxReminders: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private apiUrl = `${environment.apiUrl}/notifications`;

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

  // Get notification preferences for the current user
  getPreferences(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/settings`, this.getAuthHeaders());
  }

  // Update notification preferences
  updatePreferences(settings: NotificationSettings): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/settings`, settings, this.getAuthHeaders());
  }

  // Trigger test email notification
  sendTestEmail(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/test-email`, {}, this.getAuthHeaders());
  }
}