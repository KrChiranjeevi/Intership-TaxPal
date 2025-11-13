import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service'; // adjust path if needed
import { RouterModule,Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    const { email } = this.forgotForm.value;

    (this.authService as any).forgotPassword(email).subscribe({
      next: (res) => {
        console.log('Reset link sent:', res.link); // Mock email link printed here
        this.successMessage = 'Password reset link has been sent to your email (check console).';
        this.errorMessage = '';
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message || 'Something went wrong. Please try again.';
        this.successMessage = '';
      }
    });
  }
}
