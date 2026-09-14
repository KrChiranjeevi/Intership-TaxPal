import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap, Observable } from 'rxjs';



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

  login(credentials: { email: string; password: string }) {
  return this.http.post(`${this.api}/login`, credentials).pipe(
    tap((res: any) => {
      if (res.data?.accessToken) this.saveToken(res.data.accessToken);

      // ------------------- STORE USER -------------------
      if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data)); // store user data
      }
    })
  );
}




register(data: any) {
  return this.http.post(`${this.api}/register`, data).pipe(
    tap((res: any) => {
      if (res.data?.accessToken) this.saveToken(res.data.accessToken);
    })
  );
}

saveToken(token: string) { localStorage.setItem('token', token); }
  getToken(): string | null { return localStorage.getItem('token'); }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getProfile(): Observable<{ success: boolean; data: UserProfile }> {
    return this.http.get<{ success: boolean; data: UserProfile }>(`${this.api}/profile`);
  }

  updateProfile(data: Partial<UserProfile>): Observable<{ success: boolean; data: UserProfile; message?: string }> {
    return this.http.put<{ success: boolean; data: UserProfile; message?: string }>(`${this.api}/profile`, data);
  }
}
