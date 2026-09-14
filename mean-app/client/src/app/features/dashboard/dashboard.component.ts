// src/app/features/dashboard/dashboard.component.ts
import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { AddIncomeComponent } from '../transactions/add-income/add-income.component';
import { AddExpenseComponent } from '../transactions/add-expense/add-expense.component';
import { TransactionService } from '@core/services/transaction.service';
import { DashboardService, DashboardData, DashboardTransaction, DashboardPeriod } from '@core/services/dashboard.service';
import { ChartConfiguration } from 'chart.js';

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

  loading = true;
  isPeriodLoading = false;
  errorMessage: string | null = null;
  isDashboardEmpty = false;
  isPeriodEmpty = false;
  dashboardData: DashboardData | null = null;

  selectedPeriod: DashboardPeriod = 'monthly';
  periodLabel = 'This Month';
  periodSubtitle = "Here's your financial summary for this month.";
  incomeCardTitle = 'Monthly Income';
  expenseCardTitle = 'Monthly Expenses';

  monthlyIncome = 0;
  monthlyExpenses = 0;
  estimatedTaxDue = 0;
  savingsRate = 0;
  transactions: DashboardTransaction[] = [];

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
    private dashboardService: DashboardService,
    private txService: TransactionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userName = user.name || user.username || user.email || 'User';
      } catch {
        this.userName = 'User';
      }
    }

    this.loadDashboardData('monthly', true);
  }

  ngAfterViewInit(): void {
    // Relying on CSS animations (defined in styles.scss) for smooth transitions
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onPeriodChange(period: DashboardPeriod): void {
    if (this.selectedPeriod === period && !this.errorMessage) {
      return; // Prevent duplicate API requests if user selects the same period
    }
    this.selectedPeriod = period;
    this.updatePeriodLabels(period);
    this.loadDashboardData(period, false);
  }

  private updatePeriodLabels(period: DashboardPeriod): void {
    if (period === 'quarterly') {
      this.incomeCardTitle = 'Quarterly Income';
      this.expenseCardTitle = 'Quarterly Expenses';
      this.periodSubtitle = "Here's your financial summary for this quarter.";
    } else if (period === 'yearly') {
      this.incomeCardTitle = 'Annual Income';
      this.expenseCardTitle = 'Annual Expenses';
      this.periodSubtitle = "Here's your financial summary for this year.";
    } else {
      this.incomeCardTitle = 'Monthly Income';
      this.expenseCardTitle = 'Monthly Expenses';
      this.periodSubtitle = "Here's your financial summary for this month.";
    }
  }

  loadDashboardData(period: DashboardPeriod = this.selectedPeriod, isInitial: boolean = false): void {
    if (isInitial) {
      this.loading = true;
    } else {
      this.isPeriodLoading = true;
    }
    this.errorMessage = null;

    this.dashboardService.getDashboardSummary(period).subscribe({
      next: (res) => {
        this.loading = false;
        this.isPeriodLoading = false;
        if (res && res.success && res.data) {
          this.dashboardData = res.data;
          this.periodLabel = res.data.periodLabel || (period === 'quarterly' ? 'This Quarter' : period === 'yearly' ? 'This Year' : 'This Month');

          // Check if user has zero transactions overall
          this.isDashboardEmpty = res.data.allTimeTotalTransactions === 0;

          // Check if selected period specifically has zero financial activity
          const periodTxCount = res.data.periodTotalTransactions ?? res.data.summary?.totalTransactions ?? 0;
          const periodInc = res.data.summary?.periodIncome ?? res.data.summary?.monthlyIncome ?? 0;
          const periodExp = res.data.summary?.periodExpenses ?? res.data.summary?.monthlyExpenses ?? 0;
          this.isPeriodEmpty = !this.isDashboardEmpty && (periodTxCount === 0 && periodInc === 0 && periodExp === 0);

          // 1. Populate summary values from backend
          const summary = res.data.summary;
          this.monthlyIncome = summary?.periodIncome ?? summary?.monthlyIncome ?? res.data.totalIncome ?? 0;
          this.monthlyExpenses = summary?.periodExpenses ?? summary?.monthlyExpenses ?? res.data.totalExpenses ?? 0;
          this.estimatedTaxDue = summary?.estimatedTax ?? res.data.estimatedTax ?? 0;
          this.savingsRate = summary?.savingsRate ?? 0;

          // 2. Populate recent transactions list from backend
          this.transactions = res.data.recentTransactions ?? [];

          // 3. Render charts from backend aggregated response
          this.renderCharts(res.data);
        } else {
          this.errorMessage = 'Unable to load dashboard data. Please try again.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.isPeriodLoading = false;
        console.error('Error fetching dashboard data:', err?.message || err);
        this.errorMessage = 'Unable to load dashboard data. Please try again.';
      }
    });
  }

  private renderCharts(data: DashboardData): void {
    // 1️⃣ Bar Chart: 12-Month Income vs Expenses from backend
    const points = data.incomeVsExpenses ?? [];
    const labels = points.map(p => p.month);
    const incomeData = points.map(p => p.income);
    const expenseData = points.map(p => p.expense);

    this.barChartData = {
      labels,
      datasets: [
        { data: incomeData, label: 'Income', backgroundColor: '#00d2ff', borderRadius: 4, barPercentage: 0.6 },
        { data: expenseData, label: 'Expense', backgroundColor: '#ff5252', borderRadius: 4, barPercentage: 0.6 }
      ]
    };

    // 2️⃣ Doughnut Chart: Expense Breakdown by Category from backend
    const breakdown = data.expenseBreakdown ?? [];
    const backgroundColors = [
      '#00e676', '#00d2ff', '#a855f7', '#ff5252', '#ffca28',
      '#00BCD4', '#8BC34A', '#FFC107', '#E91E63', '#3F51B5'
    ];

    if (breakdown.length > 0) {
      const pieLabels = breakdown.map(b => b.category);
      const pieValues = breakdown.map(b => b.amount);

      this.pieLegendItems = breakdown.map((item, idx) => ({
        label: item.category,
        percentage: item.percentage.toFixed(0),
        color: backgroundColors[idx % backgroundColors.length]
      }));

      this.pieChartData = {
        labels: pieLabels,
        datasets: [
          {
            data: pieValues,
            backgroundColor: backgroundColors.slice(0, pieLabels.length),
            borderColor: '#181d27',
            borderWidth: 2
          }
        ]
      };
    } else {
      this.pieLegendItems = [];
      this.pieChartData = {
        labels: ['No expenses'],
        datasets: [{ data: [1], backgroundColor: ['#334155'] }]
      };
    }

    // Force chart re-rendering safely
    setTimeout(() => {
      if (this.barChart?.chart) {
        this.barChart.chart.update();
      }
      if (this.pieChart?.chart) {
        this.pieChart.chart.update();
      }
    }, 100);
  }

  onIncomeAdded(data: any): void {
    const payload = { ...data, date: new Date(data.date).toISOString() };
    this.txService.addIncome(payload).subscribe({
      next: () => {
        this.showIncome = false;
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Error adding income', err);
        alert(err?.error?.message || 'Error adding income');
      }
    });
  }

  onExpenseAdded(data: any): void {
    const payload = { ...data, date: new Date(data.date).toISOString() };
    this.txService.addExpense(payload).subscribe({
      next: () => {
        this.showExpense = false;
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Error adding expense', err);
        alert(err?.error?.message || 'Error adding expense');
      }
    });
  }
}
