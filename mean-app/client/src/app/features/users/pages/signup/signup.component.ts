import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  signupForm: FormGroup;
  isSubmitting = false;
  showSuccessToast = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      country: [''],
      incomeBracket: ['']
    });
  }

  onSubmit() {
    this.errorMessage = '';
    if (!this.signupForm.valid) {
      this.errorMessage = 'Please fill out all required fields correctly.';
      return;
    }

    this.isSubmitting = true;
    const { username, name, email, password, country, incomeBracket } = this.signupForm.value;

    this.authService.register({ username, name, email, password, country, incomeBracket })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.showSuccessToast = true;

            try {
              sessionStorage.setItem('taxpal_signup_success', 'true');
            } catch {
              // Ignore sessionStorage error in restricted environments
            }

            // Immediately login so user acquires JWT tokens and profile
            this.authService.login({ email, password }).subscribe({
              next: () => {
                setTimeout(() => {
                  this.router.navigate(['/dashboard']);
                }, 1000);
              },
              error: (loginErr) => {
                console.error('Auto-login error after registration:', loginErr);
                // Fallback to login page if token generation fails
                setTimeout(() => {
                  this.router.navigate(['/login']);
                }, 1500);
              }
            });
          } else {
            this.isSubmitting = false;
            this.errorMessage = res.message || 'Error creating account';
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Registration error:', err);
          this.errorMessage = err.error?.message || 
            (err.status === 0 ? 'Unable to connect to server. Please check your connection.' : 'Server error while creating account');
        }
      });
  }
}