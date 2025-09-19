// import { Component } from '@angular/core';
// import { Router } from '@angular/router';
// import { TransactionService } from '../../../core/services/transaction.service';
// // src/app/features/transactions/expense/expense.component.ts
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// @Component({
//   selector: 'app-expense',
//   standalone: true, // ✅ standalone रखा है
//   imports: [CommonModule, FormsModule],
 
//   templateUrl: './expense.component.html',
//   styleUrls: ['./expense.component.scss']
// })
// export class ExpenseComponent {
//   expense = { amount: null as number | null, description: '' };
//   submitting = false;

//   constructor(private tx: TransactionService, private router: Router) {}

//   addExpense() {
//     if (!this.expense.amount) {
//       alert('Please enter amount');
//       return;
//     }
//     this.submitting = true;
//     this.tx.addExpense(this.expense).subscribe({
//       next: () => {
//         this.submitting = false;
//         this.router.navigate(['/dashboard']);
//       },
//       error: (err) => {
//         console.error(err);
//         this.submitting = false;
//         alert('Error saving expense');
//       }
//     });
//   }
// }


import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-expense.component.html',
  styleUrls: ['./add-expense.component.scss']
})
export class AddExpenseComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<any>();

  expenseData = {
    description: '',
    amount: null as number | null,
    category: '',
    date: '',
    notes: ''
  };

  categories = ['Food', 'Rent', 'Utilities', 'Other'];

  onCancel() {
    this.close.emit();
  }

  onSubmit() {
    if (!this.expenseData.description || !this.expenseData.amount || !this.expenseData.category || !this.expenseData.date) {
      alert('Please fill all required fields');
      return;
    }
    this.submitForm.emit(this.expenseData);
    this.close.emit();
  }
}
