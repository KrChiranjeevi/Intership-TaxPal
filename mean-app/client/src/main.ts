import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const appRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./app/features/users/pages/login/login.component').then(
        m => m.LoginComponent
      ),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./app/features/users/pages/signup/signup.component').then(
        m => m.SignupComponent
      ),
  },
  { 
    path: 'dashboard',
    loadComponent: () =>
      import('./app/features/dashboard/dashboard.component').then(
        m => m.DashboardComponent
      ),
  },
  {
    path: 'income',
    loadComponent: () =>

      import('./app/features/transactions/add-income/add-income.component').then(
        m => m.AddIncomeComponent
      ),
  },

  {
  path: 'transactions',
  loadComponent: () => import('./app/features/transactions/transactions.component').then(m => m.TransactionsComponent)
},
{
  path: 'budget',
  loadComponent: () => import('./app/features/budgets/budget.component').then(m => m.BudgetComponent)
},
  {
    path: 'expense',
    loadComponent: () =>
      import('./app/features/transactions/add-expense/add-expense.component').then(
        m => m.AddExpenseComponent
      ),
  },
  { path: '**', redirectTo: 'login' },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(),
    importProvidersFrom(BrowserAnimationsModule, FormsModule, ReactiveFormsModule),
  ],
}).catch(err => console.error(err));


// import { bootstrapApplication } from '@angular/platform-browser';
// import { AppComponent } from './app/app.component';
// import { provideRouter } from '@angular/router';
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
