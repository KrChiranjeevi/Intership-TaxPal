import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BudgetService } from '@core/services/budget.service';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss']
})
export class BudgetComponent implements OnInit {
  budgets: Array<any> = [];
  showCreateForm = false;

  newBudget = {
    category: '',
    amount: null as number | null,
    month: '', // will store 'YYYY-MM' (input type="month")
    description: '',
    spent: 0
  };

  totalBudget = 0;
  totalSpent = 0;
  remaining = 0;
  budgetHealth = { status: 'Unknown', color: '#aaa' };

  constructor(private budgetService: BudgetService) {}

  ngOnInit(): void {
    this.fetchBudgets();
  }

  fetchBudgets(): void {
    this.budgetService.getAllBudgets().subscribe({
      next: (res: any) => {
        // support APIs that return either { success: true, data: [...] } or a bare array
        this.budgets = Array.isArray(res) ? res : (res?.data ?? []);
        this.recalcTotals();
      },
      error: (err) => {
        console.error('Error fetching budgets', err);
        this.budgets = [];
        this.recalcTotals();
      }
    });
  }

  openForm() {
    this.showCreateForm = true;
  }

  cancelForm() {
    this.showCreateForm = false;
    this.resetForm();
  }

  resetForm() {
    this.newBudget = {
      category: '',
      amount: null,
      month: '',
      description: '',
      spent: 0
    };
  }

  saveBudget() {
    // basic validation
    if (!this.newBudget.category || !this.newBudget.amount || !this.newBudget.month) {
      alert('Please fill Category, Amount and Month.');
      return;
    }

    // prepare payload - make sure backend expects this shape
    const payload = {
      category: this.newBudget.category,
      amount: Number(this.newBudget.amount),
      month: this.newBudget.month, // e.g. 2025-09
      description: this.newBudget.description ?? '',
      spent: 0
    };

    this.budgetService.createBudget(payload).subscribe({
      next: (res: any) => {
        // if API returns created resource or array, refresh
        this.showCreateForm = false;
        this.resetForm();
        this.fetchBudgets();
      },
      error: (err) => {
        console.error('Error creating budget', err);
        alert(err?.error?.message || 'Failed to create budget');
      }
    });
  }

  recalcTotals() {
    this.totalBudget = this.budgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    this.totalSpent = this.budgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0);
    this.remaining = this.totalBudget - this.totalSpent;

    const ratio = this.totalBudget > 0 ? (this.totalSpent / this.totalBudget) : 0;
    if (ratio < 0.6) {
      this.budgetHealth = { status: 'Good', color: '#4CAF50' };
    } else if (ratio < 0.9) {
      this.budgetHealth = { status: 'Warning', color: '#FFB300' };
    } else {
      this.budgetHealth = { status: 'Critical', color: '#F44336' };
    }
  }
}
