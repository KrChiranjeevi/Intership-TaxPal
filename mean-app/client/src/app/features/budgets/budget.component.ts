// budget.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BudgetService, Budget } from '@core/services/budget.service';
import { CategoriesService, Category } from '@core/services/categories.service';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss']
})
export class BudgetComponent implements OnInit {
  budgets: Budget[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Categories list
  availableCategories: string[] = [];

  // Summary stats
  totalBudget = 0;
  totalSpent = 0;
  remaining = 0;
  overBudgetCount = 0;
  budgetHealth = { status: 'Good', color: '#10b981', css: 'good' };

  // Create Modal State
  showCreateForm = false;
  newBudget = {
    category: '',
    amount: null as number | null,
    month: '', // 'YYYY-MM'
    description: ''
  };
  createError = '';
  isSubmittingCreate = false;

  // Edit Modal State
  showEditForm = false;
  editingBudget: {
    id: string;
    category: string;
    amount: number | null;
    month: string;
    description: string;
  } | null = null;
  editError = '';
  isSubmittingEdit = false;

  // Delete Modal State
  showDeleteConfirm = false;
  deletingBudgetId: string | null = null;
  deletingBudgetCategory = '';
  isSubmittingDelete = false;

  constructor(
    private budgetService: BudgetService,
    private categoriesService: CategoriesService
  ) {}

  ngOnInit(): void {
    // Set default month to current month YYYY-MM
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.newBudget.month = currentMonth;

    this.loadCategories();
    this.fetchBudgets();
  }

  loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: (cats: Category[]) => {
        if (cats && cats.length > 0) {
          const expenseCats = cats.filter(c => c.type === 'expense').map(c => c.name);
          this.availableCategories = expenseCats.length > 0 ? Array.from(new Set(expenseCats)) : Array.from(new Set(cats.map(c => c.name)));
        } else {
          this.availableCategories = [
            'Food', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other'
          ];
        }
      },
      error: () => {
        this.availableCategories = [
          'Food', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other'
        ];
      }
    });
  }

  fetchBudgets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.budgetService.getAllBudgets().subscribe({
      next: (res) => {
        this.isLoading = false;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        this.budgets = Array.isArray(list) ? list : [];
        this.recalcTotals();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching budgets', err);
        this.errorMessage = 'Unable to load budgets. Please try again.';
        this.budgets = [];
        this.recalcTotals();
      }
    });
  }

  recalcTotals(): void {
    this.totalBudget = this.budgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    this.totalSpent = this.budgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0);
    this.remaining = Math.max(0, this.totalBudget - this.totalSpent);
    this.overBudgetCount = this.budgets.filter(b => b.isOverBudget).length;

    const ratio = this.totalBudget > 0 ? (this.totalSpent / this.totalBudget) : 0;
    if (this.overBudgetCount > 0) {
      this.budgetHealth = {
        status: `${this.overBudgetCount} Over Budget`,
        color: '#f43f5e',
        css: 'critical'
      };
    } else if (ratio >= 0.85) {
      this.budgetHealth = { status: 'Warning', color: '#f59e0b', css: 'warning' };
    } else {
      this.budgetHealth = { status: 'Good', color: '#10b981', css: 'good' };
    }
  }

  // --- Create Budget ---

  openForm(): void {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.newBudget = {
      category: this.availableCategories[0] || '',
      amount: null,
      month: currentMonth,
      description: ''
    };
    this.createError = '';
    this.showCreateForm = true;
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.createError = '';
  }

  saveBudget(): void {
    if (!this.newBudget.category || !this.newBudget.category.trim()) {
      this.createError = 'Category is required.';
      return;
    }
    if (this.newBudget.amount === null || isNaN(Number(this.newBudget.amount)) || Number(this.newBudget.amount) <= 0) {
      this.createError = 'Budget amount must be greater than 0.';
      return;
    }
    if (!this.newBudget.month) {
      this.createError = 'Month is required.';
      return;
    }

    this.isSubmittingCreate = true;
    this.createError = '';

    const payload = {
      category: this.newBudget.category.trim(),
      amount: Number(this.newBudget.amount),
      month: this.newBudget.month.length === 7 ? `${this.newBudget.month}-01` : this.newBudget.month,
      description: this.newBudget.description ? this.newBudget.description.trim() : null
    };

    this.budgetService.createBudget(payload).subscribe({
      next: () => {
        this.isSubmittingCreate = false;
        this.showCreateForm = false;
        this.showToast('Budget created successfully');
        this.fetchBudgets();
      },
      error: (err) => {
        this.isSubmittingCreate = false;
        console.error('Error creating budget', err);
        this.createError = err?.error?.message || 'Failed to create budget. Please check your inputs.';
      }
    });
  }

  // --- Edit Budget ---

  openEditForm(b: Budget): void {
    let formattedMonth = '';
    if (b.month) {
      const d = new Date(b.month);
      if (!isNaN(d.getTime())) {
        formattedMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    this.editingBudget = {
      id: b.id,
      category: b.category,
      amount: b.amount,
      month: formattedMonth,
      description: b.description || ''
    };
    this.editError = '';
    this.showEditForm = true;
  }

  cancelEditForm(): void {
    this.showEditForm = false;
    this.editingBudget = null;
    this.editError = '';
  }

  updateBudget(): void {
    if (!this.editingBudget) return;

    const { id, category, amount, month, description } = this.editingBudget;

    if (!category || !category.trim()) {
      this.editError = 'Category is required.';
      return;
    }
    if (amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      this.editError = 'Budget amount must be greater than 0.';
      return;
    }
    if (!month) {
      this.editError = 'Month is required.';
      return;
    }

    this.isSubmittingEdit = true;
    this.editError = '';

    const payload = {
      category: category.trim(),
      amount: Number(amount),
      month: month.length === 7 ? `${month}-01` : month,
      description: description ? description.trim() : null
    };

    this.budgetService.updateBudget(id, payload).subscribe({
      next: () => {
        this.isSubmittingEdit = false;
        this.showEditForm = false;
        this.editingBudget = null;
        this.showToast('Budget updated successfully');
        this.fetchBudgets();
      },
      error: (err) => {
        this.isSubmittingEdit = false;
        console.error('Error updating budget', err);
        this.editError = err?.error?.message || 'Failed to update budget. Please try again.';
      }
    });
  }

  // --- Delete Budget ---

  openDeleteConfirm(b: Budget): void {
    this.deletingBudgetId = b.id;
    this.deletingBudgetCategory = b.category;
    this.showDeleteConfirm = true;
  }

  cancelDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.deletingBudgetId = null;
    this.deletingBudgetCategory = '';
  }

  confirmDelete(): void {
    if (!this.deletingBudgetId) return;

    this.isSubmittingDelete = true;

    this.budgetService.deleteBudget(this.deletingBudgetId).subscribe({
      next: () => {
        this.isSubmittingDelete = false;
        this.showDeleteConfirm = false;
        this.deletingBudgetId = null;
        this.showToast('Budget deleted successfully');
        this.fetchBudgets();
      },
      error: (err) => {
        this.isSubmittingDelete = false;
        console.error('Error deleting budget', err);
        this.showDeleteConfirm = false;
        this.errorMessage = err?.error?.message || 'Failed to delete budget. Please try again.';
      }
    });
  }

  private showToast(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      if (this.successMessage === msg) {
        this.successMessage = '';
      }
    }, 4000);
  }
}