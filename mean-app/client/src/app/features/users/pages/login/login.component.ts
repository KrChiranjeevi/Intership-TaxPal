// import { Component } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';
// import { AuthService } from '@core/services/auth.service';
// import { HttpClientModule } from '@angular/common/http';


// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.scss']
// })
// export class LoginComponent {
//   loginForm: FormGroup;
//   loading = false;

//   constructor(
//     private fb: FormBuilder,
//     private router: Router,
//     private authService: AuthService
//   ) {
//     this.loginForm = this.fb.group({
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', Validators.required]
//     });
//   }

//   onSubmit() {
//     if (!this.loginForm.valid) return alert('Please fill out all required fields');

//     this.loading = true; // Set loading state

//     this.authService.login(this.loginForm.value).subscribe({
//       next: (res: any) => {
//         this.loading = false;
        
//         // ✅ CRITICAL FIX: Use saveAuthData to save both token and user object
//         if (res.token && res.user) {
//             this.authService.saveAuthData(res.token, res.user);
//             alert(`Welcome, ${res.user.name}!`); // Show welcome message using real name
//             this.router.navigate(['/dashboard']); // Navigate only once
//         } else {
//              // Handle cases where backend might return success without token (should not happen)
//              alert('Login successful, but no token received.');
//              this.router.navigate(['/dashboard']);
//         }
//       },
//       error: (err) => {
//         this.loading = false;
//         console.error('Login error:', err);
//         // Display backend message or default
//         alert(err.error?.message || 'Invalid email or password');
//       }
//     });
//   }
// }




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
    if (!this.loginForm.valid) return alert('Please fill out all required fields');

    this.loading = true; // Set loading state

    this.authService.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        this.loading = false;
        
        // ✅ CRITICAL FIX: Calling the correct method 'saveAuthData'
        if (res.token && res.user) {
            this.authService.saveAuthData(res.token, res.user); 
            alert(`Welcome, ${res.user.name}!`); // Show welcome message using real name
            this.router.navigate(['/dashboard']); // Navigate only once
        } else {
             // Handle case where backend returns success but no token/user object
             alert('Login successful, but received no authorization data.');
             this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Login error:', err);
        // Display backend message or default
        alert(err.error?.message || 'Invalid email or password');
      }
    });
  }
}
