// src/app/core/services/offline.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface QueuedTransaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private onlineStatus$ = new BehaviorSubject<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  public isOnline$: Observable<boolean> = this.onlineStatus$.asObservable();

  private canInstallSubject$ = new BehaviorSubject<boolean>(false);
  public canInstall$: Observable<boolean> = this.canInstallSubject$.asObservable();

  private deferredPrompt: any = null;
  private queueKey = 'taxpal_offline_transactions_queue';

  constructor(private http: HttpClient) {
    this.initNetworkListeners();
    this.initInstallPromptListener();
  }

  private initNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.onlineStatus$.next(true);
      this.syncQueuedTransactions();
    });

    window.addEventListener('offline', () => {
      this.onlineStatus$.next(false);
    });
  }

  private initInstallPromptListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstallSubject$.next(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstallSubject$.next(false);
    });
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) return false;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.canInstallSubject$.next(false);
    return outcome === 'accepted';
  }

  private getQueueKey(): string {
    if (typeof localStorage === 'undefined') return 'taxpal_offline_tx_queue_default';
    try {
      const rawUser = localStorage.getItem('user');
      const userId = rawUser ? JSON.parse(rawUser)?.id : null;
      return userId ? `taxpal_offline_tx_queue_${userId}` : 'taxpal_offline_tx_queue_default';
    } catch {
      return 'taxpal_offline_tx_queue_default';
    }
  }

  public getQueue(): QueuedTransaction[] {
    if (typeof localStorage === 'undefined') return [];
    const key = this.getQueueKey();
    const raw = localStorage.getItem(key);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public queueTransaction(data: Omit<QueuedTransaction, 'id' | 'createdAt'>): void {
    const key = this.getQueueKey();
    const queue = this.getQueue();
    const item: QueuedTransaction = {
      ...data,
      id: 'offline_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    queue.push(item);
    localStorage.setItem(key, JSON.stringify(queue));
  }

  public clearQueue(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.getQueueKey());
  }

  public syncQueuedTransactions(): void {
    const key = this.getQueueKey();
    const queue = this.getQueue();
    if (queue.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    // Atomically clear current user queue before replay
    const items = [...queue];
    localStorage.removeItem(key);

    for (const item of items) {
      this.http.post(`${environment.apiUrl}/transactions`, {
        type: item.type,
        amount: item.amount,
        category: item.category,
        description: item.description,
        date: item.date
      }, { headers }).subscribe({
        next: () => {
          // Successfully synced item
        },
        error: (err) => {
          // If auth expired (401/403), do not re-queue blindly
          if (err.status === 401 || err.status === 403) {
            console.warn('[OfflineService] Authentication expired during sync. Re-login required.');
            return;
          }
          // Network or server error — safely put back in queue
          const currentQueue = this.getQueue();
          currentQueue.push(item);
          localStorage.setItem(key, JSON.stringify(currentQueue));
        }
      });
    }
  }
}
