import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';

// ✅ Define all routes
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/users/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/users/pages/signup/signup.component').then(
        (m) => m.SignupComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'income',
    loadComponent: () =>
      import('./features/transactions/add-income/add-income.component').then(
        (m) => m.AddIncomeComponent
      ),
  },
  {
    path: 'expense',
    loadComponent: () =>
      import('./features/transactions/add-expense/add-expense.component').then(
        (m) => m.AddExpenseComponent
      ),
  },
  {
    path: 'budget',
    loadComponent: () =>
      import('./features/budgets/budget.component').then(
        (m) => m.BudgetComponent
      ),
  },
  
  /*{
    path: 'tax-estimation',
    loadComponent: () =>
      import('./features/tax-estimation/tax-estimation.component').then(
        (m) => m.TaxEstimationComponent
      ),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
  },*/

  // Wildcard redirect
  { path: '**', redirectTo: 'login' },
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideHttpClient()],
};
