import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';

// ✅ Tumhare routes
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/users/pages/login/login.component').then(
        m => m.LoginComponent
      )
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/users/pages/signup/signup.component').then(
        m => m.SignupComponent
      )
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        m => m.DashboardComponent
      )
  },
  {
    path: 'income',
    loadComponent: () =>
      import('./features/transactions/add-income/add-income.component').then(
        m => m.AddIncomeComponent
      )
  },
  {
    path: 'expense',
    loadComponent: () =>
      import('./features/transactions/add-expense/add-expense.component').then(
        m => m.AddExpenseComponent
      )
  }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};
