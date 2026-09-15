import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsService, NotificationSettings } from '@core/services/notifications.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  settings: NotificationSettings = {
    emailNotifications: false,
    transactionAlerts: false,
    budgetWarnings: false,
    taxReminders: false
  };

  message: string = '';

  constructor(private notificationsService: NotificationsService) {}

  ngOnInit() {
    this.loadPreferences();
  }

  loadPreferences() {
    this.notificationsService.getPreferences().subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data) {
          this.settings = {
            emailNotifications: !!data.emailNotifications,
            transactionAlerts: !!data.transactionAlerts,
            budgetWarnings: !!data.budgetWarnings,
            taxReminders: !!data.taxReminders
          };
        }
      },
      error: (err) => console.error('Failed to load preferences', err)
    });
  }

  // Call this method whenever a toggle changes
  savePreferences() {
    this.message = '';
    this.notificationsService.updatePreferences(this.settings).subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data) {
          this.settings = {
            emailNotifications: !!data.emailNotifications,
            transactionAlerts: !!data.transactionAlerts,
            budgetWarnings: !!data.budgetWarnings,
            taxReminders: !!data.taxReminders
          };
        }
        this.message = 'Notification preferences updated!';
        setTimeout(() => (this.message = ''), 3000);
      },
      error: (err) => console.error('Failed to update preferences', err)
    });
  }
}
