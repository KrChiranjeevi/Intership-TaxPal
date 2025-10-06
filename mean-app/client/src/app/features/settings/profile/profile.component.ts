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
      next: (res) => {
        this.user = res;
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to load profile';
      }
    });
  }

  saveChanges() {
    this.authService.updateProfile(this.user).subscribe({
      next: (res) => {
        this.user = res;
        this.message = 'Profile updated successfully!';
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to update profile';
      }
    });
  }
}
