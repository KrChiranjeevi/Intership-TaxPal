// src/app/features/dashboard/dashboard.component.ts
import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { AddIncomeComponent } from '../transactions/add-income/add-income.component';
import { AddExpenseComponent } from '../transactions/add-expense/add-expense.component';
import { TransactionService } from '@core/services/transaction.service';
import { BudgetService } from '@core/services/budget.service';
import { ChartConfiguration } from 'chart.js';
import { TaxEstimatorService } from '@core/services/tax-estimator.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, AddIncomeComponent, AddExpenseComponent, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('barChart') barChart?: BaseChartDirective;
  @ViewChild('pieChart') pieChart?: BaseChartDirective;

  showIncome = false;
  showExpense = false;
  userName = 'User';

  monthlyIncome = 0;
  monthlyExpenses = 0;
  estimatedTaxDue = 0;
  latestTaxEstimate: any = null;
  savingsRate = 0;
  transactions: any[] = [];

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { 
      x: { 
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        border: { display: false },
        ticks: { color: '#6b7280' }
      }, 
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawTicks: false },
        border: { display: false },
        ticks: { color: '#6b7280', padding: 10 }
      } 
    }
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Income', backgroundColor: '#00d2ff', borderRadius: 4, barPercentage: 0.6 },
      { data: [], label: 'Expense', backgroundColor: '#ff5252', borderRadius: 4, barPercentage: 0.6 }
    ]
  };

  public pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: { legend: { display: false } }
  };

  public pieChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{ data: [] }]
  };

  pieLegendItems: Array<{label: string, percentage: string, color: string}> = [];

  constructor(
    private txService: TransactionService,
    private authService: AuthService,
    private router: Router,
    private budgetService: BudgetService,
    private taxService: TaxEstimatorService,   
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    const savedTax = localStorage.getItem('estimatedTaxDue');
    if (savedTax) this.estimatedTaxDue = +savedTax;

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userName = user.name || user.username || user.email || 'User';
      } catch { this.userName = 'User'; }
    }
  }

  ngAfterViewInit(): void {
    // Relying on CSS animations (defined in styles.scss) instead of GSAP for more stable visibility
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
    this.estimatedTaxDue = +((this.monthlyIncome - this.monthlyExpenses) * 0.15).toFixed(2);
    localStorage.setItem('estimatedTaxDue', this.estimatedTaxDue.toString());

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
const totalExpense = data.reduce((a,b) => a+b, 0);

const backgroundColors = [
  '#00e676', '#00d2ff', '#a855f7', '#ff5252', '#ffca28',
  '#00BCD4', '#8BC34A', '#FFC107', '#E91E63', '#3F51B5'
];

this.pieLegendItems = labels.map((label, idx) => ({
  label,
  percentage: ((sumsByCategory[label] / totalExpense) * 100).toFixed(0),
  color: backgroundColors[idx % backgroundColors.length]
}));

this.pieChartData = labels.length
  ? {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderColor: '#181d27', // matching card background
          borderWidth: 2
        }
      ]
    }
  : {
      labels: ['No expenses'],
      datasets: [{ data: [1], backgroundColor: ['#ccc'] }]
    };

// 🩵 Ensure the chart type is DOUGHNUT (runtime check without type error)
if (this.pieChart?.chart) {
  const chartInstance = this.pieChart.chart;
  // If chart type is not doughnut, rebuild it correctly
  if ((chartInstance as any).config.type !== 'doughnut') {
    (chartInstance as any).destroy();
    this.pieChart.chart = new (window as any).Chart(chartInstance.canvas, {
      type: 'doughnut',
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
      },
      error: (err) => {
        console.error('Error adding expense', err);
        alert(err?.error?.message || 'Error adding expense');
      }
    });
  }
}
