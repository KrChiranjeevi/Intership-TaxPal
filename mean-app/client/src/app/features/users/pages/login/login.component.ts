
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }


// onSubmit() {
//   if (this.loginForm.valid) {
//     const { username, password } = this.loginForm.value;

//     // Hardcoded demo credentials
//     if (username === 'demo' && password === 'password') {
//       alert(`Welcome, ${username}!`);
//         console.log('navigating to dashboard');
//       this.router.navigate(['/dashboard']);
//     } else {
//       alert('Invalid username or password');
//     }
//   } else {
//     alert('Please fill out all fields');
//   }
// }
// }

onSubmit() {
  if (this.loginForm.valid) {
    console.log('Login Data:', this.loginForm.value);
    alert(`Welcome, ${this.loginForm.value.username}!`);
    this.router.navigate(['/dashboard']);   // ✅ ab chalega
  } else {
    alert('Please fill out all fields');
  }
  console.log("navigating to dashboard");
}

}
