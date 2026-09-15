import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { SecurityService } from '@core/services/security.service';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})
export class SecurityComponent {
  oldPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  twoFactorEnabled: boolean = false;
  message: string = '';
  isSuccess: boolean = false;

  // Export Data state
  isExporting: boolean = false;

  // Danger zone state
  showDeleteModal: boolean = false;
  deleteConfirmationInput: string = '';
  isDeleting: boolean = false;
  deleteError: string = '';

  constructor(
    private securityService: SecurityService,
    private authService: AuthService,
    private router: Router
  ) {}

  updatePassword() {
    this.message = '';
    if (!this.oldPassword || !this.newPassword) {
      this.message = 'Please enter both current and new password.';
      this.isSuccess = false;
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.message = 'New password and confirm password do not match!';
      this.isSuccess = false;
      return;
    }

    if (this.newPassword.length < 8) {
      this.message = 'Password must be at least 8 characters long.';
      this.isSuccess = false;
      return;
    }

    this.authService.changePassword(this.oldPassword, this.newPassword).subscribe({
      next: (res) => {
        this.message = res.message || 'Password changed successfully!';
        this.isSuccess = true;
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.message = err.error?.message || 'Error changing password!';
        this.isSuccess = false;
      }
    });
  }

  toggleTwoFactor() {
    this.securityService.toggleTwoFactorAuth(this.twoFactorEnabled).subscribe({
      next: (res) => {
        this.message = res.message || 'Two-factor authentication updated!';
        this.isSuccess = true;
      },
      error: (err) => {
        this.message = err.error?.message || 'Error updating two-factor authentication!';
        this.isSuccess = false;
      }
    });
  }

  exportData() {
    this.isExporting = true;
    this.authService.exportData().subscribe({
      next: (blob: Blob) => {
        this.isExporting = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taxpal-account-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.isExporting = false;
        this.message = 'Failed to export account data. Please try again.';
        this.isSuccess = false;
      }
    });
  }

  openDeleteModal() {
    this.showDeleteModal = true;
    this.deleteConfirmationInput = '';
    this.deleteError = '';
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteConfirmationInput = '';
    this.deleteError = '';
  }

  confirmDeleteAccount() {
    if (this.deleteConfirmationInput.trim().toUpperCase() !== 'DELETE') {
      this.deleteError = 'Please type DELETE in capital letters to confirm.';
      return;
    }

    this.isDeleting = true;
    this.deleteError = '';

    this.authService.deleteAccount().subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isDeleting = false;
        this.deleteError = err.error?.message || 'Failed to delete account. Please try again.';
      }
    });
  }
}
