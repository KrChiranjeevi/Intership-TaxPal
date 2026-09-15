// src/app/features/errors/session-expired/session-expired.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-icon">
          <span class="material-icons">hourglass_empty</span>
        </div>
        <h1>Session Expired</h1>
        <p>Your session has expired due to inactivity or token refresh timeout. Please log in again to continue.</p>
        <div class="error-actions">
          <a routerLink="/login" class="btn-primary">
            <span class="material-icons">login</span> Return to Log In
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0f1e;
      font-family: 'Inter', sans-serif;
    }
    .error-content {
      text-align: center;
      padding: 2.5rem;
      background: rgba(17, 24, 39, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      backdrop-filter: blur(12px);
      max-width: 460px;
    }
    .error-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      background: rgba(0, 210, 255, 0.1);
      border: 1px solid rgba(0, 210, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      .material-icons { font-size: 2.5rem; color: #00d2ff; }
    }
    h1 { color: #f1f5f9; font-size: 1.6rem; font-weight: 700; margin-bottom: 0.75rem; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 2rem; }
    .error-actions { display: flex; justify-content: center; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: linear-gradient(135deg, #00d2ff, #a855f7);
      color: #fff; padding: 0.8rem 1.8rem;
      border-radius: 10px; font-size: 0.95rem; font-weight: 600;
      text-decoration: none; cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 210, 255, 0.25);
      transition: opacity 0.2s;
      &:hover { opacity: 0.9; }
    }
  `]
})
export class SessionExpiredComponent {}
