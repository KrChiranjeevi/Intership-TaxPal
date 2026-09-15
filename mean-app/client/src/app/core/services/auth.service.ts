import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap, Observable, throwError } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  country?: string;
  incomeBracket?: string;
  currency?: string;
  timezone?: string;
  language?: string;
  theme?: string;
  avatarUrl?: string;
  taxRegion?: string;
  twoFactorEnabled?: boolean;
}


@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl + '/auth';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.api}/login`, credentials).pipe(
      tap((res: any) => {
        if (res.data?.accessToken) this.saveToken(res.data.accessToken);
        if (res.data?.refreshToken) this.saveRefreshToken(res.data.refreshToken);

        if (res.data) {
          const { accessToken, refreshToken, ...userWithoutTokens } = res.data;
          localStorage.setItem('user', JSON.stringify(userWithoutTokens));
        }
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.api}/register`, data).pipe(
      tap((res: any) => {
        if (res.data?.accessToken) this.saveToken(res.data.accessToken);
        if (res.data?.refreshToken) this.saveRefreshToken(res.data.refreshToken);
      })
    );
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post(`${this.api}/refresh-token`, { refreshToken }).pipe(
      tap((res: any) => {
        const newAccessToken = res?.data?.accessToken || res?.accessToken;
        if (newAccessToken) {
          this.saveToken(newAccessToken);
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.api}/forgot-password`, { email });
  }

  resetPassword(data: { email: string; token: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.api}/reset-password`, data);
  }

  saveToken(token: string) { localStorage.setItem('token', token); }
  getToken(): string | null { return localStorage.getItem('token'); }

  saveRefreshToken(token: string) { localStorage.setItem('refreshToken', token); }
  getRefreshToken(): string | null { return localStorage.getItem('refreshToken'); }

  logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      // Invalidate on backend without blocking UI
      this.http.post(`${this.api}/logout`, { refreshToken }).subscribe({
        error: () => {},
      });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getProfile(): Observable<{ success: boolean; data: UserProfile }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
    return this.http.get<{ success: boolean; data: UserProfile }>(`${this.api}/profile`, { headers });
  }

  updateProfile(data: Partial<UserProfile>): Observable<{ success: boolean; data: UserProfile; message?: string }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
    return this.http.put<{ success: boolean; data: UserProfile; message?: string }>(`${this.api}/profile`, data, { headers }).pipe(
      tap((res) => {
        if (res.data) {
          const stored = localStorage.getItem('user');
          const current = stored ? JSON.parse(stored) : {};
          localStorage.setItem('user', JSON.stringify({ ...current, ...res.data }));
        }
      })
    );
  }

  changePassword(currentPasswordOrDto: string | { currentPassword?: string; oldPassword?: string; newPassword: string }, newPasswordParam?: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
    let payload: any;
    if (typeof currentPasswordOrDto === 'string') {
      payload = {
        oldPassword: currentPasswordOrDto,
        currentPassword: currentPasswordOrDto,
        newPassword: newPasswordParam
      };
    } else {
      payload = {
        oldPassword: currentPasswordOrDto.oldPassword || currentPasswordOrDto.currentPassword,
        currentPassword: currentPasswordOrDto.currentPassword || currentPasswordOrDto.oldPassword,
        newPassword: currentPasswordOrDto.newPassword
      };
    }
    return this.http.post(`${this.api}/change-password`, payload, { headers });
  }

  exportData(): Observable<Blob> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
    return this.http.post(`${this.api}/export-data`, {}, {
      headers,
      responseType: 'blob' as 'json'
    }) as Observable<Blob>;
  }

  deleteAccount(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
    return this.http.delete(`${this.api}/account`, { headers }).pipe(
      tap(() => {
        this.logout();
      })
    );
  }
}

