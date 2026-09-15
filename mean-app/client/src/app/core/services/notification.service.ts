import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'budget_exceeded' | 'budget_warning' | 'tax_reminder' | 'report_generated' | 'ai_recommendation' | 'monthly_summary' | 'goal_completed';
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: AppNotification[];
    unreadCount: number;
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

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

  loadNotifications(filter: 'all' | 'unread' = 'all'): Observable<NotificationsResponse | null> {
    const { headers } = this.getAuthHeaders();
    return this.http.get<NotificationsResponse>(`${this.apiUrl}?filter=${filter}`, { headers }).pipe(
      tap((res) => {
        if (res && res.success && res.data) {
          this.notificationsSubject.next(res.data.notifications || []);
          this.unreadCountSubject.next(res.data.unreadCount || 0);
        }
      }),
      catchError((err) => {
        console.error('Error loading notifications:', err);
        return of(null);
      })
    );
  }

  markAsRead(id: string): Observable<any> {
    const { headers } = this.getAuthHeaders();
    return this.http.patch(`${this.apiUrl}/${id}/read`, {}, { headers }).pipe(
      tap(() => {
        const current = this.notificationsSubject.value.map(n => n.id === id ? { ...n, isRead: true } : n);
        this.notificationsSubject.next(current);
        const newUnread = Math.max(0, this.unreadCountSubject.value - 1);
        this.unreadCountSubject.next(newUnread);
      }),
      catchError((err) => {
        console.error('Error marking notification read:', err);
        return of(null);
      })
    );
  }

  markAllAsRead(): Observable<any> {
    const { headers } = this.getAuthHeaders();
    return this.http.patch(`${this.apiUrl}/read-all`, {}, { headers }).pipe(
      tap(() => {
        const current = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
        this.notificationsSubject.next(current);
        this.unreadCountSubject.next(0);
      }),
      catchError((err) => {
        console.error('Error marking all notifications read:', err);
        return of(null);
      })
    );
  }

  deleteNotification(id: string): Observable<any> {
    const { headers } = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers }).pipe(
      tap(() => {
        const target = this.notificationsSubject.value.find(n => n.id === id);
        if (target && !target.isRead) {
          this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
        }
        const updated = this.notificationsSubject.value.filter(n => n.id !== id);
        this.notificationsSubject.next(updated);
      }),
      catchError((err) => {
        console.error('Error deleting notification:', err);
        return of(null);
      })
    );
  }
}
