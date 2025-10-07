// dashboard.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { AddIncomeComponent } from '../transactions/add-income/add-income.component';
import { AddExpenseComponent } from '../transactions/add-expense/add-expense.component';
import { TransactionService } from '@core/services/transaction.service';
import { ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js';

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

  // -------------------- Bar Chart --------------------
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { labels: { color: '#fff' } } },
    scales: {
      x: { ticks: { color: '#fff' }, grid: { color: '#333' } },
      y: { ticks: { color: '#fff' }, grid: { color: '#333' } }
    }
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      { data: [], label: 'Income', backgroundColor: '#00BCD4' },
      { data: [], label: 'Expenses', backgroundColor: '#F44336' }
    ]
  };

  // -------------------- Pie Chart --------------------
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#fff' }
      }
    }
  };

  public pieChartLabels = ['Rent', 'Food', 'Travel', 'Other'];
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: this.pieChartLabels,
    datasets: [{
      data: [],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
    }]
  };
  public pieChartType: ChartType = 'pie';

  constructor(
    private txService: TransactionService,
    private authService: AuthService,
    private router: Router
  ) {
    this.loadTransactions();
  }

  // -------------------- Logout --------------------
  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // -------------------- Transactions Load --------------------
  loadTransactions() {
    this.txService.getTransactions().subscribe({
      next: (res: any) => {
        this.transactions = res.data;
        this.calculateStats();
        this.updateCharts();
      },
      error: (err) => console.error('Error loading transactions', err)
    });
  }

  // -------------------- Stats Calculation --------------------
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

  // -------------------- Charts Update --------------------
  updateCharts() {
    // Pie chart: Expense categories
    const categories = ['Rent', 'Food', 'Travel', 'Other'];
    const categoryData = categories.map(cat =>
      this.transactions
        .filter(t => t.type === 'expense' && t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0)
    );
    this.pieChartData.datasets[0].data = categoryData;

    // Bar chart: Income vs Expenses (latest 1 month)
    this.barChartData.datasets[0].data = [this.monthlyIncome];
    this.barChartData.datasets[1].data = [this.monthlyExpenses];
  }

  // -------------------- Income Add --------------------
  onIncomeAdded(data: any) {
    const payload = { ...data, date: new Date(data.date).toISOString() };
    this.txService.addIncome(payload).subscribe({
      next: () => {
        alert('Income added successfully');
        this.showIncome = false;
        this.loadTransactions();
      },
      error: (err) => {
        console.error('Error adding income', err);
        alert(err.error?.message || 'Error adding income');
      }
    });
  }

  // -------------------- Expense Add --------------------
  onExpenseAdded(data: any) {
    const payload = { ...data, date: new Date(data.date).toISOString() };
    this.txService.addExpense(payload).subscribe({
      next: () => {
        alert('Expense added successfully');
        this.showExpense = false;
        this.loadTransactions();
      },
      error: (err) => {
        console.error('Error adding expense', err);
        alert(err.error?.message || 'Error adding expense');
      }
    });
  }
}
