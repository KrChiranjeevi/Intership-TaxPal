import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  template: `<h1>Transactions Page</h1>`,
  styles: [`h1 { color: #fff; }`]
})
export class TransactionsComponent {}