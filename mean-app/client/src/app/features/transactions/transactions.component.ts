import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '@core/services/transaction.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  transactions: any[] = [];

  constructor(private txService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions() {
    this.txService.getTransactions().subscribe({
      next: (res: any) => {
        const txs = Array.isArray(res) ? res : (res?.data ?? []);
        this.transactions = Array.isArray(txs) ? txs : [];
      },
      error: (err) => console.error('Error loading transactions', err)
    });
  }

  deleteTransaction(id: string) {
    if(confirm("Are you sure you want to delete this transaction?")) {
      this.txService.deleteTransaction(id).subscribe({
        next: () => {
          this.loadTransactions();
        },
        error: (err) => {
          console.error("Error deleting transaction", err);
          alert("Failed to delete the transaction.");
        }
      });
    }
  }
}