// budget.component.ts

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
    description: ''
  };

  totalBudget = 0;
  totalSpent = 0;
  remaining = 0;
  budgetHealth = { status: 'Good', color: '#10b981', css: 'good' };

  constructor(private budgetService: BudgetService) {}

  ngOnInit(): void {
    this.fetchBudgets();
  }

  fetchBudgets(): void {
    this.budgetService.getAllBudgets().subscribe({
      next: (res: any) => {
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
      description: ''
    };
  }

  saveBudget() {
    if (!this.newBudget.category || !this.newBudget.amount || !this.newBudget.month) {
      alert('Please fill Category, Amount and Month.');
      return;
    }

    const payload = {
      category: this.newBudget.category,
      amount: Number(this.newBudget.amount),
      month: this.newBudget.month + '-01', // convert 'YYYY-MM' to full date string
      description: this.newBudget.description ?? '',
      spent: 0
    };

    this.budgetService.createBudget(payload).subscribe({
      next: () => {
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

  // Overall dashboard health
  const ratio = this.totalBudget > 0 ? (this.totalSpent / this.totalBudget) : 0;
  if (ratio < 0.6) {
    this.budgetHealth = { status: 'Good', color: '#10b981', css: 'good' };
  } else if (ratio < 0.9) {
    this.budgetHealth = { status: 'Warning', color: '#f59e0b', css: 'warning' };
  } else {
    this.budgetHealth = { status: 'Critical', color: '#f43f5e', css: 'critical' };
  }

  // Per-budget row health
  this.budgets = this.budgets.map(b => {
    const bRatio = b.amount ? (Number(b.spent || 0) / b.amount) : 0;
    let rowHealth = { status: 'Good', color: '#10b981', css: 'good' };
    if (bRatio >= 0.9) rowHealth = { status: 'Critical', color: '#f43f5e', css: 'critical' };
    else if (bRatio >= 0.6) rowHealth = { status: 'Warning', color: '#f59e0b', css: 'warning' };
    return { ...b, rowHealth };
  });
}

  applyExpenseToBudget(expense: any) {
    const expenseMonth = expense.date.slice(0, 7); // YYYY-MM
    const budgetIndex = this.budgets.findIndex(
      b => b.category === expense.category && b.month.slice(0, 7) === expenseMonth
    );

    if (budgetIndex >= 0) {
      const budget = this.budgets[budgetIndex];
      budget.spent = (Number(budget.spent) || 0) + Number(expense.amount);
      this.budgets[budgetIndex] = budget;
      this.recalcTotals();
    } else {
      console.warn(`No budget found for category "${expense.category}" in month "${expenseMonth}"`);
    }
  }
}