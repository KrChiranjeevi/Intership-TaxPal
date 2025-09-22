import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.signupForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      name: ['', Validators.required], // ← backend expects `name`, not fullName
      email: ['', [Validators.required, Validators.email]],
      country: [''],
      incomeBracket: ['']
    });
  }

  onSubmit() {
    if (!this.signupForm.valid) {
      alert('Please fill out all required fields correctly');
      return;
    }

    const { username, name, email, password, country, incomeBracket } = this.signupForm.value;

    this.authService.register({ username, name, email, password, country, incomeBracket })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            alert(`Account created successfully for ${username}`);
          } else {
            alert(res.message || 'Error creating account');
          }
        },
        error: (err) => {
          console.error(err);
          alert('Server error while creating account');
        }
      });
  }
}
