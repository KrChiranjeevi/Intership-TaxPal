import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService, Category } from '@core/services/categories.service';
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

  //categories = ['Food', 'Rent', 'Utilities', 'Other'];
  categories: string[] = [];

  constructor(private categoriesService: CategoriesService) {}

  ngOnInit() {
    this.loadExpenseCategories();
  }

  loadExpenseCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (res: Category[]) => {
        const expenseCategories = res
          .filter(c => c.type === 'expense')
          .map(c => c.name);
        // Use defaults if user has no categories set up yet
        this.categories = expenseCategories.length > 0 ? expenseCategories : [
          'Food', 'Rent', 'Transport', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Other'
        ];
      },
      error: (err) => {
        console.error('Error fetching expense categories', err);
        this.categories = ['Food', 'Rent', 'Transport', 'Utilities', 'Other'];
      }
    });
  }

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