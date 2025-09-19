// import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
// src/app/features/transactions/income/income.component.ts
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// @Component({
//   selector: 'app-income',
//     standalone: true, // ✅ standalone रखा है
//   imports: [CommonModule, FormsModule], // standalone component में जो modules चाहिए
//   templateUrl: './income.component.html',
//   styleUrls: ['./income.component.scss']
// })
// export class IncomeComponent {
//   income = { amount: null as number | null, description: '' };
//   submitting = false;

//   constructor(private tx: TransactionService, private router: Router) {}

//   addIncome() {
//     if (!this.income.amount) {
//       alert('Please enter amount');
//       return;
//     }
//     this.submitting = true;
//     this.tx.addIncome(this.income).subscribe({
//       next: () => {
//         this.submitting = false;
//         this.router.navigate(['/dashboard']);
//       },
//       error: (err) => {
//         console.error(err);
//         this.submitting = false;
//         alert('Error saving income');
//       }
//     });
//   }
// }


import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-income',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-income.component.html',
  styleUrls: ['./add-income.component.scss']
})
export class AddIncomeComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<any>();

  incomeData = {
    description: '',
    amount: null as number | null,
    category: '',
    date: '',
    notes: ''
  };

  categories = ['Salary', 'Business', 'Other'];

  onCancel() {
    this.close.emit();
  }

  onSubmit() {
    if (!this.incomeData.description || !this.incomeData.amount || !this.incomeData.category || !this.incomeData.date) {
      alert('Please fill all required fields');
      return;
    }
    this.submitForm.emit(this.incomeData);
    this.close.emit();
  }
}
