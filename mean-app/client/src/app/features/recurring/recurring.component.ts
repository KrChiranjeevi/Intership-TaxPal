import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RecurringService, RecurringTransaction } from '@core/services/recurring.service';

@Component({
  selector: 'app-recurring',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './recurring.component.html',
  styleUrls: ['./recurring.component.scss']
})
export class RecurringComponent implements OnInit {
  recurringList: RecurringTransaction[] = [];
  loading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  showModal = false;
  editingId: string | null = null;
  recurringForm: FormGroup;
  isSubmitting = false;

  frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  categories = [
    'Housing & Rent', 'Utilities', 'Subscription', 'Insurance', 'Salary', 'Investment', 'Dining & Food', 'Transport', 'Other'
  ];

  constructor(
    private recurringService: RecurringService,
    private fb: FormBuilder
  ) {
    this.recurringForm = this.fb.group({
      title: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      category: ['Subscription'],
      type: ['expense', Validators.required],
      frequency: ['monthly', Validators.required],
      startDate: [new Date().toISOString().substring(0, 10)]
    });
  }

  ngOnInit() {
    this.loadRecurring();
  }

  loadRecurring() {
    this.loading = true;
    this.recurringService.getRecurring().subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.success) {
          this.recurringList = res.data || [];
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading recurring transactions:', err);
      }
    });
  }

  openCreateModal() {
    this.editingId = null;
    this.recurringForm.reset({
      title: '',
      amount: '',
      category: 'Subscription',
      type: 'expense',
      frequency: 'monthly',
      startDate: new Date().toISOString().substring(0, 10)
    });
    this.showModal = true;
  }

  openEditModal(item: RecurringTransaction) {
    this.editingId = item.id;
    this.recurringForm.patchValue({
      title: item.title,
      amount: item.amount,
      category: item.category || 'Subscription',
      type: item.type,
      frequency: item.frequency,
      startDate: new Date(item.nextRun).toISOString().substring(0, 10)
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingId = null;
  }

  saveRecurring() {
    if (this.recurringForm.invalid) return;

    this.isSubmitting = true;
    const formVal = this.recurringForm.value;

    if (this.editingId) {
      this.recurringService.updateRecurring(this.editingId, formVal).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showToast('Recurring transaction updated successfully');
          this.closeModal();
          this.loadRecurring();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.message || 'Failed to update';
        }
      });
    } else {
      this.recurringService.createRecurring(formVal).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showToast('Recurring transaction created successfully');
          this.closeModal();
          this.loadRecurring();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.message || 'Failed to create';
        }
      });
    }
  }

  toggleStatus(item: RecurringTransaction) {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    this.recurringService.toggleStatus(item.id, newStatus).subscribe({
      next: () => {
        item.status = newStatus;
        this.showToast(`Recurring payment ${newStatus === 'active' ? 'activated' : 'paused'}`);
      }
    });
  }

  deleteRecurring(id: string) {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) return;

    this.recurringService.deleteRecurring(id).subscribe({
      next: () => {
        this.recurringList = this.recurringList.filter(r => r.id !== id);
        this.showToast('Recurring transaction removed');
      }
    });
  }

  triggerProcessNow() {
    this.recurringService.processDue().subscribe({
      next: (res) => {
        this.showToast(res.processed > 0 ? `Processed ${res.processed} due recurring payment(s)` : 'All recurring payments are up to date');
        this.loadRecurring();
      }
    });
  }

  showToast(msg: string) {
    this.successMessage = msg;
    setTimeout(() => {
      if (this.successMessage === msg) this.successMessage = null;
    }, 4000);
  }

  get totalMonthlyCommitment(): number {
    return this.recurringList
      .filter(r => r.status === 'active' && r.type === 'expense')
      .reduce((sum, r) => {
        if (r.frequency === 'monthly') return sum + r.amount;
        if (r.frequency === 'yearly') return sum + (r.amount / 12);
        if (r.frequency === 'weekly') return sum + (r.amount * 4.33);
        if (r.frequency === 'daily') return sum + (r.amount * 30);
        return sum + r.amount;
      }, 0);
  }
}
