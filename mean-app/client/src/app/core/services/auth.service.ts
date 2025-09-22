import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl + '/auth';

  constructor(private http: HttpClient) {}

  register(data: {
    username: string;
    name: string;
    email: string;
    password: string;
    country?: string;
    incomeBracket?: string;
  }): Observable<any> {
    return this.http.post(`${this.api}/register`, data).pipe(
      tap((res: any) => {
        if (res.token) this.saveToken(res.token);
      })
    );
  }


  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.api}/login`, credentials).pipe(
      tap((res: any) => {
        if (res.accessToken) this.saveToken(res.accessToken);
      })
    );
  }

  saveToken(token: string) { localStorage.setItem('token', token); }
  getToken(): string | null { return localStorage.getItem('token'); }
  logout() { localStorage.removeItem('token'); }
}
