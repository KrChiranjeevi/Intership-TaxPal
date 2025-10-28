import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute,RouterModule, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service'; // adjust path if needed

@Component({
  selector: 'app-reset-password',
  standalone: true,
   imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  token: string = '';
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    const emailFromUrl = this.route.snapshot.queryParamMap.get('email') || '';
    this.resetForm.patchValue({ email: emailFromUrl });
  }

  onSubmit() {
    if (this.resetForm.invalid) return;

    const { email,password, confirmPassword } = this.resetForm.value;
    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    this.authService.resetPassword(this.token, password,email).subscribe({
      next: () => {
        this.successMessage = 'Password reset successful! Redirecting to login...';
        this.errorMessage = '';
        alert('Your password has been successfully updated!');
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message || 'Something went wrong.';
        this.successMessage = '';
      }
    });
  }
}
