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

  constructor(private notificationsService: NotificationsService) {}

  ngOnInit() {
    this.loadPreferences();
  }

  loadPreferences() {
    this.notificationsService.getPreferences().subscribe({
      next: (prefs) => (this.settings = prefs),
      error: (err) => console.error('Failed to load preferences', err)
    });
  }

  // Call this method whenever a toggle changes
  savePreferences() {
    this.notificationsService.updatePreferences(this.settings).subscribe({
      next: (updated) => (this.settings = updated),
      error: (err) => console.error('Failed to update preferences', err)
    });
  }
}
