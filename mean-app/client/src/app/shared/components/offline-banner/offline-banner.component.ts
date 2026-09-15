// src/app/shared/components/offline-banner/offline-banner.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineService } from '../../../core/services/offline.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Offline Alert Ribbon -->
    <div *ngIf="!isOnline" class="offline-banner">
      <div class="banner-content">
        <span class="material-icons banner-icon">wifi_off</span>
        <span class="banner-text">
          <strong>You are currently offline.</strong> TaxPal is running in offline mode. Any changes are stored locally and will sync when you reconnect.
        </span>
      </div>
    </div>

    <!-- PWA Install Prompt Floating Chip -->
    <div *ngIf="canInstall && isOnline && !dismissedInstall" class="install-prompt-chip">
      <div class="chip-content">
        <span class="material-icons">install_mobile</span>
        <span>Install TaxPal as Desktop/Mobile App</span>
      </div>
      <div class="chip-actions">
        <button class="btn-install" (click)="installApp()">Install</button>
        <button class="btn-dismiss" (click)="dismissPrompt()">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .offline-banner {
      background: linear-gradient(90deg, #f59e0b, #d97706);
      color: #0f172a;
      padding: 10px 20px;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      position: sticky;
      top: 0;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      animation: slideDown 0.3s ease-out;
    }

    .banner-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .banner-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .install-prompt-chip {
      position: fixed;
      bottom: 95px;
      right: 28px;
      background: #1e293b;
      border: 1px solid rgba(0, 210, 255, 0.3);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(0, 210, 255, 0.15);
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 9998;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      color: #f1f5f9;
      animation: fadeIn 0.3s ease;
    }

    .chip-content {
      display: flex;
      align-items: center;
      gap: 8px;
      .material-icons { color: #38bdf8; font-size: 1.2rem; }
    }

    .chip-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-install {
      background: linear-gradient(135deg, #00d2ff, #3a7bd5);
      border: none;
      color: #fff;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      &:hover { opacity: 0.9; }
    }

    .btn-dismiss {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      font-size: 0.9rem;
      &:hover { color: #f1f5f9; }
    }

    @keyframes slideDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class OfflineBannerComponent implements OnInit, OnDestroy {
  isOnline = true;
  canInstall = false;
  dismissedInstall = false;

  private onlineSub?: Subscription;
  private installSub?: Subscription;

  constructor(private offlineService: OfflineService) {}

  ngOnInit(): void {
    this.onlineSub = this.offlineService.isOnline$.subscribe(status => {
      this.isOnline = status;
    });

    this.installSub = this.offlineService.canInstall$.subscribe(can => {
      this.canInstall = can;
    });
  }

  ngOnDestroy(): void {
    this.onlineSub?.unsubscribe();
    this.installSub?.unsubscribe();
  }

  installApp(): void {
    this.offlineService.promptInstall().then((accepted) => {
      if (accepted) {
        this.canInstall = false;
      }
    });
  }

  dismissPrompt(): void {
    this.dismissedInstall = true;
  }
}
