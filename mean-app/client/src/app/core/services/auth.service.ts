import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl + '/auth';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }) {
  return this.http.post(`${this.api}/login`, credentials).pipe(
    tap((res: any) => {
      if (res.data?.accessToken) this.saveToken(res.data.accessToken);
    })
  );
}


  register(data: any): Observable<any> {
    return this.http.post(`${this.api}/register`, data).pipe(
      tap((res: any) => {
        if (res.data?.accessToken) this.saveToken(res.data.accessToken);
      })
    );
  }

  saveToken(token: string) { localStorage.setItem('token', token); }
  getToken(): string | null { return localStorage.getItem('token'); }
  logout() { localStorage.removeItem('token'); }
}
