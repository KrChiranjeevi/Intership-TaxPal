import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  constructor(private securityService: SecurityService) {}

  updatePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.message = "New password and confirm password do not match!";
      return;
    }

    this.securityService.changePassword(this.oldPassword, this.newPassword)
      .subscribe({
        next: (res) => this.message = res.message || "Password changed successfully!",
        error: (err) => this.message = err.error?.message || "Error changing password!"
      });
  }

  toggleTwoFactor() {
    this.securityService.toggleTwoFactorAuth(this.twoFactorEnabled)
      .subscribe({
        next: (res) => this.message = res.message || "Two-factor authentication updated!",
        error: (err) => this.message = err.error?.message || "Error updating two-factor authentication!"
      });
  }
}
