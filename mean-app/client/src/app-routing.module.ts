// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';
// import { LoginComponent } from './features/users/pages/login/login.component';
// import { SignupComponent } from './features/users/pages/signup/signup.component';
// import { AuthGuard } from '@core/guard/auth.guard';
// import { MainLayoutComponent } from './layouts/main-layout.component';

// const routes: Routes = [
//   { path: '', redirectTo: 'login', pathMatch: 'full' },

//   { path: 'login', component: LoginComponent },
//   { path: 'signup', component: SignupComponent },

//   {
//     path: '',
//     component: MainLayoutComponent, // Wraps all main pages
//     canActivate: [AuthGuard],
//     children: [
//       { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
//       { path: 'income', loadComponent: () => import('./features/transactions/add-income/add-income.component').then(m => m.AddIncomeComponent) },
//       { path: 'expense', loadComponent: () => import('./features/transactions/add-expense/add-expense.component').then(m => m.AddExpenseComponent) },
//       { path: 'budget', loadComponent: () => import('./features/budgets/budget.component').then(m => m.BudgetComponent) },
//       //{ path: 'tax-estimation', loadComponent: () => import('./features/tax-estimation/tax-estimation.component').then(m => m.TaxEstimationComponent) },
//       //{ path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
//     ]
//   },

//   { path: '**', redirectTo: 'login' },
// ];

// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule],
// })
// export class AppRoutingModule {}



// src/app/app-routing.module.ts

// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';
// import { LoginComponent } from './features/users/pages/login/login.component';
// import { SignupComponent } from './features/users/pages/signup/signup.component';
// import { AuthGuard } from './core/guard/auth.guard';
// import { MainLayoutComponent } from './layouts/main-layout.component';
// import { DashboardComponent } from './features/dashboard/dashboard.component';
// import { IncomeComponent } from './features/transactions/add-income/add-income.component';
// import { ExpenseComponent } from './features/transactions/add-expense/add-expense.component';
// import { BudgetComponent } from './features/budgets/budget.component';

// const routes: Routes = [
//   { path: '', redirectTo: 'login', pathMatch: 'full' },
//   { path: 'login', component: LoginComponent },
//   { path: 'signup', component: SignupComponent },

//   {
//     path: '',
//     component: MainLayoutComponent, // Wraps all main pages
//     canActivate: [AuthGuard],
//     children: [
//       { path: 'dashboard', component: DashboardComponent },
//       { path: 'income', component: IncomeComponent },
//       { path: 'expense', component: ExpenseComponent },
//       { path: 'budget', component: BudgetComponent },
//     ]
//   },
//   { path: '**', redirectTo: 'login' },
// ];

// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule],
// })
// export class AppRoutingModule {}