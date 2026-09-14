import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService, Category } from '@core/services/categories.service';
import { AiService } from '@core/services/ai.service';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-expense.component.html',
  styleUrls: ['./add-expense.component.scss']
})
export class AddExpenseComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<any>();

  expenseData = {
    description: '',
    amount: null as number | null,
    category: '',
    date: '',
    notes: ''
  };

  categories: string[] = [];
  formError = '';

  // AI Suggestion State
  isSuggestingCategory = false;
  aiSuggestion: { category: string; confidence: number } | null = null;
  aiMessage = '';

  constructor(
    private categoriesService: CategoriesService,
    private aiService: AiService
  ) {}

  ngOnInit() {
    this.loadExpenseCategories();
    // Default to today's date if empty
    if (!this.expenseData.date) {
      this.expenseData.date = new Date().toISOString().split('T')[0] ?? '';
    }
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
        this.categories = ['Food', 'Rent', 'Transport', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Other'];
      }
    });
  }

  suggestCategory() {
    if (!this.expenseData.description || !this.expenseData.description.trim()) {
      this.aiMessage = 'Please enter a transaction description first to get a category suggestion.';
      return;
    }

    this.isSuggestingCategory = true;
    this.aiMessage = '';
    this.aiSuggestion = null;

    this.aiService
      .suggestCategory(
        this.expenseData.description.trim(),
        this.expenseData.amount ?? undefined,
        'expense'
      )
      .subscribe({
        next: (res) => {
          this.isSuggestingCategory = false;
          if (res.success && res.category) {
            this.aiSuggestion = {
              category: res.category,
              confidence: res.confidence
            };
            // Ensure the suggested category is present in the dropdown options
            if (!this.categories.includes(res.category)) {
              this.categories.push(res.category);
            }
          } else {
            this.aiMessage = res.message || 'Category suggestion is currently unavailable. You can select a category manually.';
          }
        },
        error: (err) => {
          this.isSuggestingCategory = false;
          this.aiMessage =
            err.error?.message ||
            'Category suggestion is currently unavailable. You can select a category manually.';
        }
      });
  }

  applySuggestion(category: string) {
    this.expenseData.category = category;
    this.aiSuggestion = null;
    this.aiMessage = '';
  }

  dismissSuggestion() {
    this.aiSuggestion = null;
    this.aiMessage = '';
  }

  onCancel() {
    this.close.emit();
  }

  onSubmit() {
    this.formError = '';
    if (!this.expenseData.description || !this.expenseData.amount || !this.expenseData.category || !this.expenseData.date) {
      this.formError = 'Please fill all required fields before submitting.';
      return;
    }
    this.submitForm.emit(this.expenseData);
    this.close.emit();
  }
}