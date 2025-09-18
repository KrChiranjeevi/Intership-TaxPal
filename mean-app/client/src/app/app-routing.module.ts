// // import { NgModule } from '@angular/core';
// // import { RouterModule, Routes } from '@angular/router';
// // import { LoginComponent } from './features/users/pages/login/login.component';
// // import { SignupComponent } from './features/users/pages/signup/signup.component';
// // import { DashboardComponent } from './features/dashboard/dashboard.component';
// // import { IncomeComponent } from './features/transactions/income/income.component';
// // import { ExpenseComponent } from './features/transactions/expense/expense.component';



// // const routes: Routes = [
// //   { path: '', redirectTo: 'login', pathMatch: 'full' },
// //   { path: 'login', component: LoginComponent },
// //   { path: 'signup', component: SignupComponent },
// //   { path: 'dashboard', component: DashboardComponent },
// //   { path: 'income', component: IncomeComponent },
// //   { path: 'expense', component: ExpenseComponent }
// // ];

// // @NgModule({
// //   imports: [RouterModule.forRoot(routes)],
// //   exports: [RouterModule]
// // })
// // export class AppRoutingModule {}



// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';

// // ✅ सही paths (standalone components होने की वजह से इन्हें सीधे import कर सकते हो)
// import { LoginComponent } from './features/users/pages/login/login.component';
// import { SignupComponent } from './features/users/pages/signup/signup.component';
// import { DashboardComponent } from './features/dashboard/dashboard.component';
// import { IncomeComponent } from './features/transactions/income/income.component';
// import { ExpenseComponent } from './features/transactions/expense/expense.component';

// const routes: Routes = [
//   { path: '', redirectTo: 'login', pathMatch: 'full' },  // default route
//   { path: 'login', component: LoginComponent },
//   { path: 'signup', component: SignupComponent },
//   { path: 'dashboard', component: DashboardComponent },
//   { path: 'income', component: IncomeComponent },
//   { path: 'expense', component: ExpenseComponent },
//   { path: '**', redirectTo: 'login' }  // ✅ fallback route
// ];

// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule]
// })
// export class AppRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LoginComponent } from './features/users/pages/login/login.component';
import { SignupComponent } from './features/users/pages/signup/signup.component';




const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
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

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
