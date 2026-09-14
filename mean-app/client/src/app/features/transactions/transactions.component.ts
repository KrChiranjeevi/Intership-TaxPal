import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  TransactionService,
  Transaction,
  TransactionFilters,
  TransactionPagination,
  TransactionSummary
} from '@core/services/transaction.service';
import { CategoriesService, Category } from '@core/services/categories.service';
import { AiService } from '@core/services/ai.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  // Data state
  transactions: Transaction[] = [];
  pagination: TransactionPagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  };
  summary: TransactionSummary = {
    totalIncome: 0,
    totalExpense: 0,
    net: 0
  };

  // UI state
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  hasAnyTransactionsOverall = false; // To distinguish between account empty vs filter empty

  // Filter state
  searchTerm = '';
  selectedType: 'all' | 'income' | 'expense' = 'all';
  selectedCategory = 'all';
  startDate = '';
  endDate = '';
  dateError = '';

  // Categories list
  availableCategories: string[] = [];

  // Debounced search subject
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Edit Modal State
  isEditModalOpen = false;
  editingTransaction: {
    id: string;
    type: 'income' | 'expense';
    amount: number | null;
    category: string;
    description: string;
    date: string;
    notes?: string;
  } | null = null;
  editModalError = '';
  isSubmittingEdit = false;

  // AI Suggestion State for Edit Modal
  isSuggestingEditCategory = false;
  editAiSuggestion: { category: string; confidence: number } | null = null;
  editAiMessage = '';

  // Delete Modal State
  isDeleteModalOpen = false;
  deletingTransactionId: string | null = null;
  deletingTransactionDescription = '';
  isSubmittingDelete = false;

  constructor(
    private txService: TransactionService,
    private categoriesService: CategoriesService,
    private aiService: AiService
  ) {}

  ngOnInit(): void {
    // Setup debounced search (300ms)
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((term) => {
        this.searchTerm = term;
        this.pagination.page = 1;
        this.loadTransactions();
      });

    this.loadCategories();
    this.checkOverallTransactions();
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  /**
   * Check if user has any transactions at all in account (unfiltered)
   * Used to distinguish between account-level empty state and filter-level empty state.
   */
  checkOverallTransactions(): void {
    this.txService.getTransactions({ limit: 1 }).subscribe({
      next: (res) => {
        const total = res.data?.pagination?.total ?? 0;
        this.hasAnyTransactionsOverall = total > 0;
      },
      error: () => {
        // Silent catch for initial check
      }
    });
  }

  /**
   * Load categories from CategoriesService
   */
  loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: (cats: Category[]) => {
        if (cats && cats.length > 0) {
          const names = Array.from(new Set(cats.map((c) => c.name)));
          this.availableCategories = names;
        } else {
          this.availableCategories = [
            'Salary', 'Freelance', 'Business', 'Investment',
            'Food', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other'
          ];
        }
      },
      error: () => {
        this.availableCategories = [
          'Salary', 'Freelance', 'Business', 'Investment',
          'Food', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other'
        ];
      }
    });
  }

  /**
   * Fetch transactions with current filters & pagination
   */
  loadTransactions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Validate dates if both provided
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      this.dateError = 'Start date cannot be after end date.';
      this.isLoading = false;
      return;
    } else {
      this.dateError = '';
    }

    const filters: TransactionFilters = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      search: this.searchTerm,
      type: this.selectedType,
      category: this.selectedCategory !== 'all' ? this.selectedCategory : undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined
    };

    this.txService.getTransactions(filters).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.transactions = res.data.transactions || [];
          this.pagination = res.data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1
          };
          this.summary = res.data.summary || {
            totalIncome: 0,
            totalExpense: 0,
            net: 0
          };

          if (this.transactions.length > 0) {
            this.hasAnyTransactionsOverall = true;
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching transactions:', err);
        this.errorMessage = 'Unable to load transactions. Please try again.';
      }
    });
  }

  // --- Filter Event Handlers ---

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  onTypeChange(): void {
    this.pagination.page = 1;
    this.loadTransactions();
  }

  onCategoryChange(): void {
    this.pagination.page = 1;
    this.loadTransactions();
  }

  onDateChange(): void {
    this.pagination.page = 1;
    this.loadTransactions();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = 'all';
    this.selectedCategory = 'all';
    this.startDate = '';
    this.endDate = '';
    this.dateError = '';
    this.pagination.page = 1;
    this.loadTransactions();
  }

  get isFiltered(): boolean {
    return (
      Boolean(this.searchTerm.trim()) ||
      this.selectedType !== 'all' ||
      this.selectedCategory !== 'all' ||
      Boolean(this.startDate) ||
      Boolean(this.endDate)
    );
  }

  // --- Pagination Handlers ---

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages && page !== this.pagination.page) {
      this.pagination.page = page;
      this.loadTransactions();
    }
  }

  prevPage(): void {
    if (this.pagination.page > 1) {
      this.goToPage(this.pagination.page - 1);
    }
  }

  nextPage(): void {
    if (this.pagination.page < this.pagination.totalPages) {
      this.goToPage(this.pagination.page + 1);
    }
  }

  // --- Edit Transaction Handlers ---

  openEditModal(tx: Transaction): void {
    let formattedDate = '';
    if (tx.date) {
      const d = new Date(tx.date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split('T')[0];
      }
    }

    this.editingTransaction = {
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description,
      date: formattedDate,
      notes: tx.notes || ''
    };
    this.editModalError = '';
    this.isSuggestingEditCategory = false;
    this.editAiSuggestion = null;
    this.editAiMessage = '';
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editingTransaction = null;
    this.editModalError = '';
    this.isSuggestingEditCategory = false;
    this.editAiSuggestion = null;
    this.editAiMessage = '';
  }

  suggestEditCategory(): void {
    if (!this.editingTransaction?.description?.trim()) {
      this.editAiMessage = 'Please enter a description first to get an AI category suggestion.';
      return;
    }

    this.isSuggestingEditCategory = true;
    this.editAiMessage = '';
    this.editAiSuggestion = null;

    this.aiService
      .suggestCategory(
        this.editingTransaction.description.trim(),
        this.editingTransaction.amount ?? undefined,
        this.editingTransaction.type
      )
      .subscribe({
        next: (res) => {
          this.isSuggestingEditCategory = false;
          if (res.success && res.category) {
            this.editAiSuggestion = {
              category: res.category,
              confidence: res.confidence
            };
            if (!this.availableCategories.includes(res.category)) {
              this.availableCategories.push(res.category);
            }
          } else {
            this.editAiMessage =
              res.message ||
              'Category suggestion is currently unavailable. You can select a category manually.';
          }
        },
        error: (err) => {
          this.isSuggestingEditCategory = false;
          this.editAiMessage =
            err.error?.message ||
            'Category suggestion is currently unavailable. You can select a category manually.';
        }
      });
  }

  applyEditAiSuggestion(category: string): void {
    if (this.editingTransaction) {
      this.editingTransaction.category = category;
    }
    this.editAiSuggestion = null;
    this.editAiMessage = '';
  }

  dismissEditAiSuggestion(): void {
    this.editAiSuggestion = null;
    this.editAiMessage = '';
  }

  submitEdit(): void {
    if (!this.editingTransaction) return;

    const { id, type, amount, category, description, date, notes } = this.editingTransaction;

    if (!description || !description.trim()) {
      this.editModalError = 'Description is required.';
      return;
    }
    if (amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      this.editModalError = 'Amount must be greater than 0.';
      return;
    }
    if (!category || !category.trim()) {
      this.editModalError = 'Category is required.';
      return;
    }
    if (!date) {
      this.editModalError = 'Date is required.';
      return;
    }

    this.isSubmittingEdit = true;
    this.editModalError = '';

    const payload: Partial<Transaction> = {
      type,
      amount: Number(amount),
      category: category.trim(),
      description: description.trim(),
      date,
      notes: notes?.trim() || undefined
    };

    this.txService.updateTransaction(id, payload).subscribe({
      next: () => {
        this.isSubmittingEdit = false;
        this.closeEditModal();
        this.showToast('Transaction updated successfully');
        this.loadTransactions();
      },
      error: (err) => {
        this.isSubmittingEdit = false;
        console.error('Failed to update transaction:', err);
        this.editModalError = err?.error?.message || 'Failed to update transaction. Please check your input.';
      }
    });
  }

  // --- Delete Transaction Handlers ---

  openDeleteModal(tx: Transaction): void {
    this.deletingTransactionId = tx.id;
    this.deletingTransactionDescription = tx.description || 'this transaction';
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deletingTransactionId = null;
    this.deletingTransactionDescription = '';
  }

  confirmDelete(): void {
    if (!this.deletingTransactionId) return;

    this.isSubmittingDelete = true;

    this.txService.deleteTransaction(this.deletingTransactionId).subscribe({
      next: () => {
        this.isSubmittingDelete = false;
        this.closeDeleteModal();
        this.showToast('Transaction deleted permanently');

        // Check if this was the last item on the current page and we're not on page 1
        if (this.transactions.length === 1 && this.pagination.page > 1) {
          this.pagination.page -= 1;
        }

        this.loadTransactions();
      },
      error: (err) => {
        this.isSubmittingDelete = false;
        console.error('Failed to delete transaction:', err);
        this.closeDeleteModal();
        this.errorMessage = err?.error?.message || 'Failed to delete transaction. Please try again.';
      }
    });
  }

  // Helper feedback toast
  private showToast(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      if (this.successMessage === msg) {
        this.successMessage = '';
      }
    }, 4000);
  }
}