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
  getPreferences(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(this.apiUrl, this.getAuthHeaders());
  }

  // Update notification preferences
  updatePreferences(settings: NotificationSettings): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(this.apiUrl, settings, this.getAuthHeaders());
  }
}
