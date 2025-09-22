import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { AddIncomeComponent } from '../transactions/add-income/add-income.component';
import { AddExpenseComponent } from '../transactions/add-expense/add-expense.component';
import { TransactionService } from '@core/services/transaction.service';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, AddIncomeComponent, AddExpenseComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  showIncome = false;
  showExpense = false;

  monthlyIncome = 0;
  monthlyExpenses = 0;
  estimatedTaxDue = 0;
  savingsRate = 0;

  transactions: any[] = [];

  // Bar chart
  public barChartOptions: ChartConfiguration['options'] = { responsive: true };
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [
      { data: [], label: 'Income' },
      { data: [], label: 'Expense' }
    ]
  };

  // Pie chart
  public pieChartOptions: ChartConfiguration['options'] = { responsive: true };
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Rent', 'Food', 'Travel', 'Other'],
    datasets: [{ data: [] }]
  };

  constructor(private txService: TransactionService) {
    this.loadTransactions();
  }

  loadTransactions() {
    this.txService.getTransactions().subscribe({
      next: (res: any[]) => {
        this.transactions = res;
        this.calculateStats();
        this.updateCharts();
      },
      error: (err) => {
        console.error('Error loading transactions', err);
      }
    });
  }

  calculateStats() {
    this.monthlyIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    this.monthlyExpenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    this.savingsRate = this.monthlyIncome
      ? ((this.monthlyIncome - this.monthlyExpenses) / this.monthlyIncome) * 100
      : 0;
  }

  updateCharts() {
    // Simple example: sum income/expense per category for pie chart
    const categories = ['Rent', 'Food', 'Travel', 'Other'];
    const categoryData = categories.map(cat =>
      this.transactions
        .filter(t => t.type === 'expense' && t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0)
    );
    this.pieChartData.datasets[0].data = categoryData;

    // For bar chart, just use monthlyIncome and monthlyExpenses as example
    this.barChartData.datasets[0].data = [this.monthlyIncome];
    this.barChartData.datasets[1].data = [this.monthlyExpenses];
  }

  onIncomeAdded(data: any) {
    this.txService.addIncome(data).subscribe({
      next: () => {
        alert('Income added successfully');
        this.showIncome = false;
        this.loadTransactions();
      },
      error: (err) => {
        console.error(err);
        alert('Error adding income');
      }
    });
  }

  onExpenseAdded(data: any) {
    this.txService.addExpense(data).subscribe({
      next: () => {
        alert('Expense added successfully');
        this.showExpense = false;
        this.loadTransactions();
      },
      error: (err) => {
        console.error(err);
        alert('Error adding expense');
      }
    });
  }
}
