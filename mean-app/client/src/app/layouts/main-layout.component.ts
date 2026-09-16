import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { NotificationService, AppNotification } from '@core/services/notification.service';
import { AiAssistantComponent } from '../shared/ai-assistant/ai-assistant.component';
import { OfflineBannerComponent } from '../shared/components/offline-banner/offline-banner.component';
import gsap from 'gsap';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    AiAssistantComponent,
    OfflineBannerComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('dropdownEl') dropdownEl?: ElementRef;
  @ViewChild('notificationWrap') notificationWrap?: ElementRef;

  sidebarCollapsed = false;
  userName = 'User';
  userInitials = 'U';
  avatarUrl: string | null = null;
  currentRouteTitle = 'Dashboard';
  isAdmin = false;

  notificationsOpen = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  notificationFilter: 'all' | 'unread' = 'all';
  hasNewNotification = false;

  private routerSub?: Subscription;
  private notifSub?: Subscription;
  private unreadSub?: Subscription;

  constructor(
    private router: Router,
    private notifService: NotificationService
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.updateTitleFromUrl(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.updateTitleFromUrl(e.urlAfterRedirects || e.url);
        this.closeModals();
      });

    // Subscribe to notifications
    this.notifSub = this.notifService.notifications$.subscribe((items) => {
      this.notifications = items;
    });

    this.unreadSub = this.notifService.unreadCount$.subscribe((count) => {
      if (count > this.unreadCount) {
        this.hasNewNotification = true;
        setTimeout(() => this.hasNewNotification = false, 3000);
      }
      this.unreadCount = count;
    });

    // Initial load of notifications
    this.notifService.loadNotifications().subscribe();
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.unreadSub?.unsubscribe();
  }

  loadUserData() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userName = user.name || user.username || user.email || 'User';
        this.userInitials = this.userName.substring(0, 2).toUpperCase();
        this.avatarUrl = user.avatarUrl || null;
        this.isAdmin = user.role === 'ADMIN';
      } catch {
        this.userName = 'User';
        this.userInitials = 'U';
        this.isAdmin = false;
      }
    }
  }

  updateTitleFromUrl(url: string) {
    if (url.includes('/dashboard')) this.currentRouteTitle = 'Dashboard';
    else if (url.includes('/transactions')) this.currentRouteTitle = 'Transactions';
    else if (url.includes('/recurring')) this.currentRouteTitle = 'Recurring Payments';
    else if (url.includes('/goals')) this.currentRouteTitle = 'Financial Goals';
    else if (url.includes('/budget')) this.currentRouteTitle = 'Budgeting';
    else if (url.includes('/tax-estimator')) this.currentRouteTitle = 'Tax Estimator';
    else if (url.includes('/reports')) this.currentRouteTitle = 'Financial Reports';
    else if (url.includes('/admin')) this.currentRouteTitle = 'Admin Portal';
    else if (url.includes('/settings')) this.currentRouteTitle = 'Settings';
    else this.currentRouteTitle = 'Overview';
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;

    if (this.notificationsOpen) {
      setTimeout(() => {
        if (this.dropdownEl?.nativeElement) {
          gsap.fromTo(
            this.dropdownEl.nativeElement,
            { opacity: 0, y: -16, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out' }
          );
        }
      }, 0);
    }
  }

  setFilter(filter: 'all' | 'unread') {
    this.notificationFilter = filter;
  }

  get filteredNotifications(): AppNotification[] {
    if (this.notificationFilter === 'unread') {
      return this.notifications.filter(n => !n.isRead);
    }
    return this.notifications;
  }

  markAsRead(id: string, event: Event) {
    event.stopPropagation();
    this.notifService.markAsRead(id).subscribe();
  }

  markAllAsRead() {
    this.notifService.markAllAsRead().subscribe();
  }

  deleteNotification(id: string, event: Event) {
    event.stopPropagation();
    this.notifService.deleteNotification(id).subscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.notificationsOpen && this.notificationWrap?.nativeElement) {
      if (!this.notificationWrap.nativeElement.contains(event.target)) {
        this.notificationsOpen = false;
      }
    }
  }

  onLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  closeModals() {
    this.notificationsOpen = false;
  }
}
