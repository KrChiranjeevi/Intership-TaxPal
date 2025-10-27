import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UsersRoutingModule } from './users-routing.module';

// Import your components
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UsersRoutingModule,
    LoginComponent,
    SignupComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent
  ]
})
export class UsersModule {}
