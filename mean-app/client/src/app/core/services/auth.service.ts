import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    return this.http.get<{ success: boolean; data: UserProfile }>(`${this.api}/profile`);
  }

  updateProfile(data: Partial<UserProfile>): Observable<{ success: boolean; data: UserProfile; message?: string }> {
    return this.http.put<{ success: boolean; data: UserProfile; message?: string }>(`${this.api}/profile`, data);
  }
}
