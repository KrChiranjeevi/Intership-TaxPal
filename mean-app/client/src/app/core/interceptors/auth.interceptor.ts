import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    console.log('AuthInterceptor token:', token); // <--- log token

    if (token) {
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer${token}` },
      });
      console.log('Request with token:', cloned);
      return next.handle(cloned);
    }

    console.log('Request without token:', req);
    return next.handle(req);
  }
}
