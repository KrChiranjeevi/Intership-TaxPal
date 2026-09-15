// src/app/features/admin/admin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService, AdminUser, PlatformAnalytics } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  analytics: PlatformAnalytics | null = null;
  users: AdminUser[] = [];
  loadingAnalytics = true;
  loadingUsers = true;
  actionLoading = false;
  message = '';
  errorMessage = '';

  // Pagination & Filters
  searchQuery = '';
  selectedRole = '';
  selectedStatus = '';
  currentPage = 1;
  pageSize = 8;
  totalPages = 1;
  totalUsersCount = 0;

  currentAdminId = '';

  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.currentAdminId = user?.id || '';
    this.loadAnalytics();
    this.loadUsers();
  }

  loadAnalytics(): void {
    this.loadingAnalytics = true;
    this.adminService.getAnalytics().subscribe({
      next: (res) => {
        this.analytics = res.data;
        this.loadingAnalytics = false;
      },
      error: (err) => {
        console.error('[Admin] Analytics load error:', err);
        this.errorMessage = 'Failed to load platform analytics.';
        this.loadingAnalytics = false;
      }
    });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.adminService.getUsers({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchQuery || undefined,
      role: this.selectedRole || undefined,
      status: this.selectedStatus || undefined
    }).subscribe({
      next: (res) => {
        this.users = res.data.users;
        this.totalPages = res.data.pagination.totalPages || 1;
        this.totalUsersCount = res.data.pagination.total || 0;
        this.loadingUsers = false;
      },
      error: (err) => {
        console.error('[Admin] Users load error:', err);
        this.errorMessage = 'Failed to load users list.';
        this.loadingUsers = false;
      }
    });
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  toggleUserStatus(user: AdminUser): void {
    const nextStatus = !user.isActive;
    const confirmMsg = nextStatus
      ? `Reactivate account for ${user.name}?`
      : `Deactivate account for ${user.name}? They will be blocked from logging in.`;

    if (!confirm(confirmMsg)) return;

    this.actionLoading = true;
    this.adminService.updateUserStatus(user.id, nextStatus).subscribe({
      next: (res) => {
        user.isActive = nextStatus;
        this.actionLoading = false;
        this.showFeedback(res.message || `User ${nextStatus ? 'activated' : 'deactivated'}.`);
        if (this.analytics) {
          this.analytics.metrics.activeUsers += nextStatus ? 1 : -1;
          this.analytics.metrics.inactiveUsers += nextStatus ? -1 : 1;
        }
      },
      error: (err) => {
        this.actionLoading = false;
        this.showError(err.error?.message || 'Failed to update user status.');
      }
    });
  }

  toggleUserRole(user: AdminUser): void {
    const nextRole: 'ADMIN' | 'USER' = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Change role for ${user.name} to ${nextRole}?`)) return;

    this.actionLoading = true;
    this.adminService.updateUserRole(user.id, nextRole).subscribe({
      next: (res) => {
        user.role = nextRole;
        this.actionLoading = false;
        this.showFeedback(res.message || `Role updated to ${nextRole}.`);
      },
      error: (err) => {
        this.actionLoading = false;
        this.showError(err.error?.message || 'Failed to update user role.');
      }
    });
  }

  deleteUser(user: AdminUser): void {
    if (!confirm(`⚠️ PERMANENT ACTION: Delete ${user.name} (${user.email}) and ALL associated data? This cannot be undone.`)) {
      return;
    }

    this.actionLoading = true;
    this.adminService.deleteUser(user.id).subscribe({
      next: (res) => {
        this.actionLoading = false;
        this.showFeedback(res.message || 'User deleted successfully.');
        this.loadUsers();
        this.loadAnalytics();
      },
      error: (err) => {
        this.actionLoading = false;
        this.showError(err.error?.message || 'Failed to delete user.');
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  showFeedback(msg: string): void {
    this.message = msg;
    setTimeout(() => (this.message = ''), 4000);
  }

  showError(msg: string): void {
    this.errorMessage = msg;
    setTimeout(() => (this.errorMessage = ''), 5000);
  }
}
