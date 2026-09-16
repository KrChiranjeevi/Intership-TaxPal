// src/app/features/dashboard/analytics/analytics.component.ts
import {
  Component, OnInit, ViewChild, AfterViewInit,
  ElementRef, Input, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import {
  DashboardService, AdvancedAnalytics,
  TrendPoint, CashFlowPoint, QuarterlyPoint, MonthlyComparison, TopCategory
} from '@core/services/dashboard.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() year?: number;

  @ViewChild('trendChart') trendChartRef?: BaseChartDirective;
  @ViewChild('cashFlowChart') cashFlowChartRef?: BaseChartDirective;
  @ViewChild('quarterlyChart') quarterlyChartRef?: BaseChartDirective;
  @ViewChild('savingsChart') savingsChartRef?: BaseChartDirective;

  analytics: AdvancedAnalytics | null = null;
  loading = true;
  error: string | null = null;

  activeTab: 'trends' | 'comparison' | 'categories' | 'insights' = 'trends';

  // ── TREND CHART (Income vs Expense line) ──────────────────────────
  trendChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  trendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        labels: { color: '#9ca3af', font: { size: 12 }, usePointStyle: true, pointStyle: 'circle' }
      },
      tooltip: { backgroundColor: '#1e2435', titleColor: '#e2e8f0', bodyColor: '#9ca3af', borderColor: '#2d3748', borderWidth: 1 }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' }, border: { display: false } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' }, border: { display: false }, beginAtZero: true }
    }
  };

  // ── CASH FLOW BAR CHART ───────────────────────────────────────────
  cashFlowChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  cashFlowChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e2435', titleColor: '#e2e8f0', bodyColor: '#9ca3af', borderColor: '#2d3748', borderWidth: 1 }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' }, border: { display: false } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' }, border: { display: false }, beginAtZero: true }
    }
  };

  // ── QUARTERLY BAR CHART ───────────────────────────────────────────
  quarterlyChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  quarterlyChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#9ca3af', font: { size: 12 }, usePointStyle: true, pointStyle: 'circle' }
      },
      tooltip: { backgroundColor: '#1e2435', titleColor: '#e2e8f0', bodyColor: '#9ca3af', borderColor: '#2d3748', borderWidth: 1 }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' }, border: { display: false } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' }, border: { display: false }, beginAtZero: true }
    }
  };

  // ── SAVINGS TREND CHART ───────────────────────────────────────────
  savingsChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  savingsChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e2435', titleColor: '#e2e8f0', bodyColor: '#9ca3af', borderColor: '#2d3748', borderWidth: 1,
        callbacks: { label: (ctx) => ` ${ctx.parsed.y.toFixed(1)}% savings rate` }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280' }, border: { display: false } },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', callback: (v) => `${v}%` },
        border: { display: false }, beginAtZero: true, max: 100
      }
    }
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['year'] && !changes['year'].firstChange) {
      this.loadAnalytics();
    }
  }

  ngAfterViewInit(): void {}

  setTab(tab: 'trends' | 'comparison' | 'categories' | 'insights'): void {
    this.activeTab = tab;
    setTimeout(() => this.refreshCharts(), 100);
  }

  public loadAnalytics(year?: number): void {
    if (year !== undefined) {
      this.year = year;
    }
    this.loading = true;
    this.error = null;
    this.dashboardService.getAdvancedAnalytics(this.year).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.analytics = res.data;
          this.buildCharts(res.data);
        } else {
          this.error = 'Unable to load analytics data.';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load analytics data.';
      }
    });
  }

  private buildCharts(data: AdvancedAnalytics): void {
    const months = data.incomeTrend.map(p => p.month.slice(0, 3));

    // Trend chart: income + expense lines
    this.trendChartData = {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: data.incomeTrend.map(p => p.value),
          borderColor: '#00d2ff',
          backgroundColor: 'rgba(0,210,255,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00d2ff',
          pointRadius: 4,
          pointHoverRadius: 7
        },
        {
          label: 'Expense',
          data: data.expenseTrend.map(p => p.value),
          borderColor: '#ff5252',
          backgroundColor: 'rgba(255,82,82,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ff5252',
          pointRadius: 4,
          pointHoverRadius: 7
        }
      ]
    };

    // Cash flow chart
    this.cashFlowChartData = {
      labels: months,
      datasets: [
        {
          label: 'Cash Flow',
          data: data.cashFlow.map(p => p.value),
          backgroundColor: data.cashFlow.map(p => p.positive ? 'rgba(0,230,118,0.75)' : 'rgba(255,82,82,0.75)'),
          borderRadius: 6,
          barPercentage: 0.6
        }
      ]
    };

    // Quarterly chart
    this.quarterlyChartData = {
      labels: data.quarterlyComparison.map(q => q.label),
      datasets: [
        {
          label: 'Income',
          data: data.quarterlyComparison.map(q => q.income),
          backgroundColor: 'rgba(0,210,255,0.7)',
          borderRadius: 6,
          barPercentage: 0.45
        },
        {
          label: 'Expense',
          data: data.quarterlyComparison.map(q => q.expense),
          backgroundColor: 'rgba(255,82,82,0.7)',
          borderRadius: 6,
          barPercentage: 0.45
        }
      ]
    };

    // Savings trend
    this.savingsChartData = {
      labels: months,
      datasets: [
        {
          label: 'Savings Rate',
          data: data.savingsTrend.map(p => p.value),
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168,85,247,0.12)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#a855f7',
          pointRadius: 4,
          pointHoverRadius: 7
        }
      ]
    };

    setTimeout(() => this.refreshCharts(), 150);
  }

  private refreshCharts(): void {
    this.trendChartRef?.chart?.update();
    this.cashFlowChartRef?.chart?.update();
    this.quarterlyChartRef?.chart?.update();
    this.savingsChartRef?.chart?.update();
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  }

  formatPercent(v: number | null): string {
    if (v === null || v === undefined) return '—';
    return (v > 0 ? '+' : '') + v.toFixed(1) + '%';
  }

  get categoryGrowthEntries(): { cat: string; change: number }[] {
    if (!this.analytics) return [];
    return Object.entries(this.analytics.categoryGrowth)
      .map(([cat, change]) => ({ cat, change }))
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 6);
  }

  get yearOnYearIncomeLabel(): string {
    const g = this.analytics?.yearlyComparison?.incomeGrowth;
    return this.formatPercent(g ?? null);
  }

  get yearOnYearExpenseLabel(): string {
    const g = this.analytics?.yearlyComparison?.expenseGrowth;
    return this.formatPercent(g ?? null);
  }
}
