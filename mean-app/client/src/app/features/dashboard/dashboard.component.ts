
// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartConfiguration, ChartOptions } from 'chart.js';
// import { NgChartsModule } from 'ng2-charts';

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [CommonModule, NgChartsModule],
//   templateUrl: './dashboard.component.html',
//   styleUrls: ['./dashboard.component.scss']
// })
// export class DashboardComponent {
//   monthlyIncome = 420;
//   monthlyExpenses = 0;
//   taxDue = 0;
//   savingsRate = 100;

//   // Dummy transactions
//   transactions = [
//     { name: 'Alex Morgan', date: 'May 8, 2024', category: 'Consulting', amount: 4320, type: 'income' },
//     { name: 'Office Depot', date: 'May 7, 2024', category: 'Business Equipment', amount: 125.50, type: 'expense' },
//     { name: 'Sarah Johnson', date: 'May 6, 2024', category: 'Web Development', amount: 2850, type: 'income' },
//     { name: 'Comcast', date: 'May 5, 2024', category: 'Internet Bill', amount: 89.99, type: 'expense' },
//   ];

//   // Income vs Expenses Chart
//   public barChartOptions: ChartOptions<'bar'> = {
//     responsive: true,
//     plugins: {
//       legend: {
//         labels: {
//           color: '#fff'
//         }
//       }
//     },
//     scales: {
//       x: {
//         ticks: { color: '#fff' },
//         grid: { color: '#333' }
//       },
//       y: {
//         ticks: { color: '#fff' },
//         grid: { color: '#333' }
//       }
//     }
//   };

//   public barChartData: ChartConfiguration<'bar'>['data'] = {
//     labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
//     datasets: [
//       { data: [150, 200, 250, 300, 350, 400], label: 'Income', backgroundColor: '#00BCD4' },
//       { data: [50, 80, 100, 150, 200, 250], label: 'Expenses', backgroundColor: '#F44336' }
//     ]
//   };

//   // Pie Chart for Expense Breakdown
//   public pieChartOptions: ChartOptions<'pie'> = {
//     responsive: true,
//     plugins: {
//       legend: {
//         labels: {
//           color: '#fff'
//         }
//       }
//     }
//   };

//   public pieChartData: ChartConfiguration<'pie'>['data'] = {
//     labels: ['Rent/Mortgage', 'Business Equipment', 'Utilities', 'Food', 'Other'],
//     datasets: [
//       {
//         data: [32, 28, 16, 12, 12],
//         backgroundColor: ['#00BCD4', '#4CAF50', '#FFC107', '#E91E63', '#9C27B0']
//       }
//     ]
//   };
// }









// src/app/features/dashboard/dashboard.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

// ⬅️ अपने AddIncome और AddExpense standalone components import करें
import { AddExpenseComponent } from '../transactions/add-expense/add-expense.component';
import { AddIncomeComponent } from '../transactions/add-income/add-income.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // सारे standalone modules/components imports में डालो
  imports: [CommonModule, NgChartsModule, AddIncomeComponent, AddExpenseComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  // Toggle variables for forms
  showIncome = false;
  showExpense = false;

  // Dummy stats
  monthlyIncome = 420.00;
  monthlyExpenses = 0.00;
  estimatedTaxDue = 0.00;
  savingsRate = 100.0;

  // Dummy transactions
  transactions = [
    { name: 'Alex Morgan', date: 'May 8, 2024', category: 'Consulting', amount: 4320, type: 'income' },
    { name: 'Office Depot', date: 'May 7, 2024', category: 'Business Equipment', amount: 125.50, type: 'expense' },
    { name: 'Sarah Johnson', date: 'May 6, 2024', category: 'Web Development', amount: 2850, type: 'income' },
    { name: 'Comcast', date: 'May 5, 2024', category: 'Internet Bill', amount: 89.99, type: 'expense' },
  ];

  // Income vs Expenses Bar Chart
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#fff' } }
    },
    scales: {
      x: { ticks: { color: '#fff' }, grid: { color: '#333' } },
      y: { ticks: { color: '#fff' }, grid: { color: '#333' } }
    }
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      { data: [150, 200, 250, 300, 350, 400], label: 'Income', backgroundColor: '#00BCD4' },
      { data: [50, 80, 100, 150, 200, 250], label: 'Expenses', backgroundColor: '#F44336' }
    ]
  };

  // Pie Chart for Expense Breakdown
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: { legend: { labels: { color: '#fff' } } }
  };

  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Rent/Mortgage', 'Business Equipment', 'Utilities', 'Food', 'Other'],
    datasets: [{
      data: [32, 28, 16, 12, 12],
      backgroundColor: ['#00BCD4', '#4CAF50', '#FFC107', '#E91E63', '#9C27B0']
    }]
  };

  // Event handlers
  onIncomeAdded(data: any) {
    console.log('Income added', data);
    this.showIncome = false;
  }

  onExpenseAdded(data: any) {
    console.log('Expense added', data);
    this.showExpense = false;
  }
}
