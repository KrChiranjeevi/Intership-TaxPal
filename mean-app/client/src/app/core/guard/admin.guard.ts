// src/app/core/guard/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    const user = this.authService.getUser();
    if (user?.role === 'ADMIN') {
      return true;
    }

    // If role is not saved in localStorage, or user is not ADMIN, deny with 403
    this.router.navigate(['/403']);
    return false;
  }
}
