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

  public getQueue(): QueuedTransaction[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(this.queueKey);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public queueTransaction(data: Omit<QueuedTransaction, 'id' | 'createdAt'>): void {
    const queue = this.getQueue();
    const item: QueuedTransaction = {
      ...data,
      id: 'offline_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    queue.push(item);
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  public syncQueuedTransactions(): void {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    // Send items sequentially
    const items = [...queue];
    localStorage.removeItem(this.queueKey);

    for (const item of items) {
      this.http.post(`${environment.apiUrl}/transactions`, {
        type: item.type,
        amount: item.amount,
        category: item.category,
        description: item.description,
        date: item.date
      }, { headers }).subscribe({
        next: () => {
          console.log('[OfflineService] Synced queued transaction:', item.description);
        },
        error: (err) => {
          console.error('[OfflineService] Failed to sync item, re-queuing:', err);
          const currentQueue = this.getQueue();
          currentQueue.push(item);
          localStorage.setItem(this.queueKey, JSON.stringify(currentQueue));
        }
      });
    }
  }
}
