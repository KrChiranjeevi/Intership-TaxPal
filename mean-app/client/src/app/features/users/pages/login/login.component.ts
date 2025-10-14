import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { HttpClientModule } from '@angular/common/http';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
  if (!this.loginForm.valid) return alert('Please fill out all fields');

  const { email, password } = this.loginForm.value;
  // this.authService.login({ email, password }).subscribe({
      this.authService.login(this.loginForm.value).subscribe({

    next: (res: any) => {
      alert(`Welcome, ${email}!`);
     this.authService.saveToken(res.token);

      this.router.navigate(['/dashboard']);

              if (res.token) {
          localStorage.setItem('token', res.token); // ✅ Save the token
          this.router.navigate(['/dashboard']);
        }

    },
    error: (err) => {
      console.error('Login error:', err);
      alert('Invalid email or password');
    }
  });
}

}
