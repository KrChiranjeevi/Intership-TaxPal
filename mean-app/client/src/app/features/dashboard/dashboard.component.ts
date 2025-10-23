// src/app/features/dashboard/dashboard.component.ts
import { Component, ViewChild, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { AddIncomeComponent } from '../transactions/add-income/add-income.component';
import { AddExpenseComponent } from '../transactions/add-expense/add-expense.component';
import { TransactionService } from '@core/services/transaction.service';
import { BudgetService } from '@core/services/budget.service';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, AddIncomeComponent, AddExpenseComponent, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @ViewChild('barChart') barChart?: BaseChartDirective;
  @ViewChild('pieChart') pieChart?: BaseChartDirective;

  showIncome = false;
  showExpense = false;

  monthlyIncome = 0;
  monthlyExpenses = 0;
  estimatedTaxDue = 0;
  savingsRate = 0;
  transactions: any[] = [];

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: true, position: 'top' } },
    scales: { x: { beginAtZero: true }, y: { beginAtZero: true } }
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Income' },
      { data: [], label: 'Expense' }
    ]
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'center' } }
  };

  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{ data: [] }]
  };

  constructor(
    private txService: TransactionService,
    private authService: AuthService,
    private router: Router,
    private budgetService: BudgetService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadTransactions() {
    this.txService.getTransactions().subscribe({
      next: (res: any) => {
        const txs = Array.isArray(res) ? res : (res?.data ?? []);
        this.transactions = Array.isArray(txs) ? txs : [];
        this.calculateStats();
        this.updateCharts();
      },
      error: (err) => console.error('Error loading transactions', err)
    });
  }

  calculateStats() {
    this.monthlyIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    this.monthlyExpenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    this.savingsRate = this.monthlyIncome
      ? +(((this.monthlyIncome - this.monthlyExpenses) / this.monthlyIncome) * 100).toFixed(2)
      : 0;
  }

  updateCharts() {
    // 1️⃣ --- Monthly aggregation for bar chart ---
    const months = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'
    ];
    const incomeByMonth = Array(12).fill(0);
    const expenseByMonth = Array(12).fill(0);

    this.transactions.forEach(t => {
      const d = new Date(t.date);
      const m = d.getMonth(); // 0–11
      if (t.type === 'income') incomeByMonth[m] += Number(t.amount || 0);
      if (t.type === 'expense') expenseByMonth[m] += Number(t.amount || 0);
    });

    this.barChartData = {
      labels: months,
      datasets: [
        { data: incomeByMonth, label: 'Income' },
        { data: expenseByMonth, label: 'Expense' }
      ]
    };

    // 2️⃣ --- Expense breakdown for pie chart ---
const expenseTx = this.transactions.filter(t => t.type === 'expense');
const sumsByCategory = expenseTx.reduce((acc: Record<string, number>, t) => {
  const cat = t.category || 'Uncategorized';
  acc[cat] = (acc[cat] || 0) + Number(t.amount || 0);
  return acc;
}, {});

const labels = Object.keys(sumsByCategory);
const data = labels.map(l => sumsByCategory[l]);

const backgroundColors = [
  '#4CAF50', '#F44336', '#2196F3', '#FF9800', '#9C27B0',
  '#00BCD4', '#8BC34A', '#FFC107', '#E91E63', '#3F51B5'
];

this.pieChartData = labels.length
  ? {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    }
  : {
      labels: ['No expenses'],
      datasets: [{ data: [1], backgroundColor: ['#ccc'] }]
    };

// 🩵 Ensure the chart type is PIE (runtime check without type error)
if (this.pieChart?.chart) {
  const chartInstance = this.pieChart.chart;
  // If chart type is not pie, rebuild it correctly
  if ((chartInstance as any).config.type !== 'pie') {
    (chartInstance as any).destroy();
    this.pieChart.chart = new (window as any).Chart(chartInstance.canvas, {
      type: 'pie',
      data: this.pieChartData,
      options: this.pieChartOptions
    });
  } else {
    chartInstance.data = this.pieChartData;
    chartInstance.update();
  }
}


// ✅ Force re-render
setTimeout(() => {
  this.barChart?.update();
  this.pieChart?.update();
}, 100);



  }

  onIncomeAdded(data: any) {
    const payload = { ...data, date: new Date(data.date).toISOString() };
    this.txService.addIncome(payload).subscribe({
      next: () => {
        this.showIncome = false;
        this.loadTransactions();
      },
      error: (err) => {
        console.error('Error adding income', err);
        alert(err?.error?.message || 'Error adding income');
      }
    });
  }

  onExpenseAdded(data: any) {
  const payload = { ...data, date: new Date(data.date).toISOString() };
  this.txService.addExpense(payload).subscribe({
    next: () => {
      this.showExpense = false;
      this.loadTransactions();
      this.applyExpenseToBudget(payload); // <-- pass payload, not raw form data
    },
    error: (err) => {
      console.error('Error adding expense', err);
      alert(err?.error?.message || 'Error adding expense');
    }
  });
}

private applyExpenseToBudget(expense: any) {
  const expenseDate = new Date(expense.date);
  const monthStr = `${expenseDate.getFullYear()}-${('0'+(expenseDate.getMonth()+1)).slice(-2)}`;

  this.budgetService.getAllBudgets().subscribe({
    next: (res: any) => {
      const budgets = Array.isArray(res) ? res : (res?.data ?? []);
      const budgetForCategory = budgets.find(
        (b: any) => b.category === expense.category && b.month?.startsWith(monthStr)
      );

      if (budgetForCategory) {
        const newSpent = (Number(budgetForCategory.spent || 0)) + Number(expense.amount || 0);
        this.budgetService.updateBudget(budgetForCategory.id, { ...budgetForCategory, spent: newSpent })
          .subscribe({
            next: () => console.log(`Budget updated for ${expense.category} in ${monthStr}`),
            error: (err) => console.error('Error updating budget', err)
          });
      } else {
        console.warn(`No budget found for ${expense.category} in ${monthStr}`);
      }
    },
    error: (err) => console.error('Error fetching budgets', err)
  });
}

}
