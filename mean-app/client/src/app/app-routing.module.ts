import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/users/pages/login/login.component';
import { SignupComponent } from './features/users/pages/signup/signup.component';
import { AuthGuard } from '@core/guard/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'income',
    loadComponent: () =>
      import('./features/transactions/add-income/add-income.component').then(
        (m) => m.AddIncomeComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'expense',
    loadComponent: () =>
      import('./features/transactions/add-expense/add-expense.component').then(
        (m) => m.AddExpenseComponent
      ),
    canActivate: [AuthGuard],
  },

  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
