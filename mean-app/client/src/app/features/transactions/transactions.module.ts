// // src/app/features/transactions/transactions.module.ts
// import { CommonModule } from '@angular/common';
// import { NgModule } from '@angular/core';
// import { FormsModule } from '@angular/forms';

// import { ExpenseComponent } from './add-expense/add-expense.component';
// import { IncomeComponent } from './add-income/add-income.component';

// @NgModule({
//   // ❌ कोई declarations नहीं क्योंकि ये standalone हैं
//   imports: [
//     CommonModule,
//     FormsModule,
//     IncomeComponent,  // ✅ standalone components यहां import होंगे
//     ExpenseComponent  // ✅
//   ],
//   exports: [
//     IncomeComponent,
//     ExpenseComponent
//   ]
// })
// export class TransactionsModule {}


// src/app/features/transactions/transactions.module.ts
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ✅ सही नाम से import करो
import { AddExpenseComponent } from './add-expense/add-expense.component';
import { AddIncomeComponent } from './add-income/add-income.component';

@NgModule({
  // standalone components को declarations में नहीं डालना
  imports: [
    CommonModule,
    FormsModule,
    AddIncomeComponent,  // standalone components को imports में डालो
    AddExpenseComponent
  ],
  exports: [
    AddIncomeComponent,
    AddExpenseComponent
  ]
})
export class TransactionsModule {}