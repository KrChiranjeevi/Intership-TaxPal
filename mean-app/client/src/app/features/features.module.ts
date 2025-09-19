// src/app/features/features.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { DashboardModule } from './dashboard/dashboard.module';
import { TransactionsModule } from './transactions/transactions.module';

@NgModule({
  // imports: [CommonModule, DashboardModule, TransactionsModule],
  // exports: [DashboardModule, TransactionsModule]
   imports: [CommonModule, TransactionsModule],  
  exports: [TransactionsModule] 
})
export class FeaturesModule {}
