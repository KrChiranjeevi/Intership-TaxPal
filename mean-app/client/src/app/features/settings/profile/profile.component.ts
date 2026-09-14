import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserProfile } from '@core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: UserProfile = {
    id: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    country: '',
    incomeBracket: ''
  };
  message: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.authService.getProfile().subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        this.user = {
          id: data.id || '',
          name: data.name || '',
          username: data.username || '',
          email: data.email || '',
          phone: data.phone || '',
          country: data.country || '',
          incomeBracket: data.incomeBracket || ''
        };
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to load profile';
      }
    });
  }

  saveChanges() {
    this.message = '';
    this.authService.updateProfile(this.user).subscribe({
      next: (res: any) => {
        const updated = res?.data || res;
        this.user = {
          ...this.user,
          ...updated
        };
        // Update stored user in localStorage so layout/sidebar reflects changes
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            localStorage.setItem('user', JSON.stringify({ ...parsed, ...this.user }));
          } catch {}
        }
        this.message = res?.message || 'Profile updated successfully!';
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to update profile';
      }
    });
  }
}