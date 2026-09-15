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
    incomeBracket: '',
    currency: 'USD',
    timezone: 'UTC',
    language: 'en',
    theme: 'dark',
    avatarUrl: ''
  };
  message: string = '';
  isSuccess: boolean = false;

  readonly presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  ];

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
          incomeBracket: data.incomeBracket || '',
          currency: data.currency || 'USD',
          timezone: data.timezone || 'UTC',
          language: data.language || 'en',
          theme: data.theme || 'dark',
          avatarUrl: data.avatarUrl || this.presetAvatars[0]
        };
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to load profile';
        this.isSuccess = false;
      }
    });
  }

  selectAvatar(url: string) {
    this.user.avatarUrl = url;
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
        this.message = res?.message || 'Profile and preferences updated successfully!';
        this.isSuccess = true;
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to update profile';
        this.isSuccess = false;
      }
    });
  }
}