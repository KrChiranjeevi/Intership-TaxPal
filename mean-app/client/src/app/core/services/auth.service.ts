import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators'; 
import { Router } from '@angular/router';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  country?: string;
  incomeBracket?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  private userApiUrl = environment.apiUrl + '/users'; // Base URL for User profile endpoints

  constructor(private http: HttpClient, private router: Router) {}

  // --- Core Authentication Methods ---

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
        tap((res: any) => {
            // ✅ FIX: Extract directly from res.token and res.user (Express response structure)
            if (res.token && res.user) { 
                this.saveAuthData(res.token, res.user);
            }
        })
    );
  }

  register(data: any): Observable<any> {
    // Note: Assuming your backend uses /signup, not /register
    return this.http.post(`${this.apiUrl}/signup`, data).pipe(
        tap((res: any) => {
            if (res.token && res.user) { 
                this.saveAuthData(res.token, res.user);
            }
        })
    );
  }

  // --- Token and State Management ---

  saveAuthData(token: string, user: UserProfile) {
    // Saves both token and user object to Local Storage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // --- Profile API Calls (Relying on AuthInterceptor) ---

  getProfile(): Observable<UserProfile> {
    // AuthInterceptor will handle adding the token automatically
    return this.http.get<UserProfile>(`${this.userApiUrl}/profile`); 
  }

  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    // AuthInterceptor will handle adding the token automatically
    return this.http.put<UserProfile>(`${this.userApiUrl}/profile`, data);
  }
}
