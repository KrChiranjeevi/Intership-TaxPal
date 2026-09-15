// src/app/features/errors/server-error/server-error.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-code">500</div>
        <div class="error-glow"></div>
        <h1>Internal Server Error</h1>
        <p>Something unexpected happened on our servers. We've logged this and are investigating.</p>
        <div class="error-actions">
          <a routerLink="/dashboard" class="btn-primary">
            <span class="material-icons">refresh</span> Try Dashboard Again
          </a>
          <button class="btn-ghost" onclick="window.location.reload()">
            <span class="material-icons">sync</span> Reload Page
          </button>
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
      padding: 2rem;
      position: relative;
    }
    .error-code {
      font-size: 8rem;
      font-weight: 900;
      background: linear-gradient(135deg, #eab308, #ef4444);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1;
      margin-bottom: 1rem;
    }
    .error-glow {
      position: absolute;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(234,179,8,0.15) 0%, transparent 70%);
      pointer-events: none;
    }
    h1 { color: #e2e8f0; font-size: 1.75rem; margin-bottom: 0.75rem; }
    p { color: #94a3b8; margin-bottom: 2rem; max-width: 440px; margin-left: auto; margin-right: auto; }
    .error-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn-primary {
      display: flex; align-items: center; gap: 0.5rem;
      background: linear-gradient(135deg, #00d2ff, #a855f7);
      color: #fff; border: none; padding: 0.75rem 1.5rem;
      border-radius: 10px; font-size: 0.9rem; font-weight: 600;
      text-decoration: none; cursor: pointer;
      transition: opacity 0.2s;
      &:hover { opacity: 0.9; }
    }
    .btn-ghost {
      display: flex; align-items: center; gap: 0.5rem;
      background: transparent; color: #9ca3af;
      border: 1px solid #1e2847; padding: 0.75rem 1.5rem;
      border-radius: 10px; font-size: 0.9rem; font-weight: 500;
      cursor: pointer; transition: border-color 0.2s, color 0.2s;
      &:hover { border-color: #9ca3af; color: #e2e8f0; }
    }
    .material-icons { font-size: 1.1rem; }
  `]
})
export class ServerErrorComponent {}
