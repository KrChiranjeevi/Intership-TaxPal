import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl + '/users';

  constructor(private http: HttpClient) {}

  register(data: { name: string; email: string; password: string }) {
    return this.http.post(`${this.api}/register`, data).pipe(
      tap((res: any) => { if (res.token) this.saveToken(res.token); })
    );
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post(`${this.api}/login`, credentials).pipe(
      tap((res: any) => { if (res.token) this.saveToken(res.token); })
    );
  }

  saveToken(token: string) { localStorage.setItem('token', token); }
  getToken() { return localStorage.getItem('token'); }
  logout() { localStorage.removeItem('token'); }
}
