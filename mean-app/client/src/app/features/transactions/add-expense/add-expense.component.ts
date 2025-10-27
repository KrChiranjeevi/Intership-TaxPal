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

  onCancel() { this.close.emit(); }

  onSubmit() {
    if (!this.expenseData.description || !this.expenseData.amount || !this.expenseData.category || !this.expenseData.date) {
      alert('Please fill all required fields');
      return;
    }
    this.submitForm.emit(this.expenseData);
    this.close.emit();
  }
}