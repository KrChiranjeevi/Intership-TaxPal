import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService, Category } from '@core/services/categories.service';
import { Observable } from 'rxjs';


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
  //categories = ['Salary', 'Business', 'Other'];
  categories: string[] = [];

  constructor(private categoriesService: CategoriesService) {}

  ngOnInit() {
    this.loadIncomeCategories();
  }
  loadIncomeCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (res: Category[]) => {
        const incomeCategories = res
          .filter(c => c.type === 'income')
          .map(c => c.name);
        // Use defaults if user has no categories set up yet
        this.categories = incomeCategories.length > 0 ? incomeCategories : [
          'Salary', 'Freelance', 'Business', 'Investment', 'Rental Income', 'Other'
        ];
      },
      error: (err) => {
        console.error('Error fetching income categories', err);
        this.categories = ['Salary', 'Freelance', 'Business', 'Investment', 'Other'];
      }
    });
  }


  onCancel() { this.close.emit(); }

  onSubmit() {
    if (!this.incomeData.description || !this.incomeData.amount || !this.incomeData.category || !this.incomeData.date) {
      alert('Please fill all required fields');
      return;
    }
    this.submitForm.emit(this.incomeData);
    this.close.emit();
  }
}