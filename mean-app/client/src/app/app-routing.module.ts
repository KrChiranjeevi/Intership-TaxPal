import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/users/pages/login/login.component';
import { SignupComponent } from './features/users/pages/signup/signup.component';
import { AuthGuard } from '@core/guard/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { ForgotPasswordComponent } from './features/users/pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/users/pages/reset-password/reset-password.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  {
    path: '',
    component: MainLayoutComponent, // Wraps all main pages
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'transactions', loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent) },
      { path: 'income', loadComponent: () => import('./features/transactions/add-income/add-income.component').then(m => m.AddIncomeComponent) },
      { path: 'expense', loadComponent: () => import('./features/transactions/add-expense/add-expense.component').then(m => m.AddExpenseComponent) },
      { path: 'budget', loadComponent: () => import('./features/budgets/budget.component').then(m => m.BudgetComponent) },
      { path: 'tax-estimator', loadComponent: () => import('./features/tax-estimator/tax-estimator.component').then(m => m.TaxEstimatorComponent) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        children: [
          {
            path: 'profile',
            loadComponent: () => import('./features/settings/profile/profile.component').then(m => m.ProfileComponent)
          },
          {
            path: 'categories',
            loadComponent: () => import('./features/settings/categories/categories.component').then(m => m.CategoriesComponent)
          },
          {
            path: 'notifications',
            loadComponent: () => import('./features/settings/notifications/notifications.component').then(m => m.NotificationsComponent)
          },
          {
            path: 'security',
            loadComponent: () => import('./features/settings/security/security.component').then(m => m.SecurityComponent)
          },
          // default to profile
          { path: '', redirectTo: 'profile', pathMatch: 'full' }
        ]
      },
    ]
  },

  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}