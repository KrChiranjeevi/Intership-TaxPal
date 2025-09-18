// import { bootstrapApplication } from '@angular/platform-browser';
// import { provideRouter } from '@angular/router';
// import { AppComponent } from './app/app.component';
// import { AppRoutingModule } from './app/app-routing.module';
// import { provideHttpClient } from '@angular/common/http';
// import { importProvidersFrom } from '@angular/core';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// bootstrapApplication(AppComponent, {
//   providers: [
//     importProvidersFrom(AppRoutingModule, BrowserAnimationsModule),
//     provideHttpClient(),
//   ]
// }).catch(err => console.error(err));


import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
// import { LoginComponent } from './app/features/users/pages/login/login.component';
// import { SignupComponent } from './app/features/users/pages/signup/signup.component';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      { path: '', redirectTo: 'login', pathMatch: 'full' },

      {
        path: 'login',
        loadComponent: () =>
          import('./app/features/users/pages/login/login.component').then(
            m => m.LoginComponent
          )
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./app/features/users/pages/signup/signup.component').then(
            m => m.SignupComponent
          )
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./app/features/dashboard/dashboard.component').then(
            m => m.DashboardComponent
          )
      },
      {
        path: 'income',
        loadComponent: () =>
          import('./app/features/transactions/add-income/add-income.component').then(
            m => m.AddIncomeComponent
          )
      },
      {
        path: 'expense',
        loadComponent: () =>
          import('./app/features/transactions/add-expense/add-expense.component').then(
            m => m.AddExpenseComponent
          )
      }
    ]),
    provideHttpClient(),
    importProvidersFrom(BrowserAnimationsModule),
  ]
}).catch(err => console.error(err));
