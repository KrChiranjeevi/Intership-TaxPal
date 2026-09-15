import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GoalService, FinancialGoal } from '@core/services/goal.service';
import * as confettiNamespace from 'canvas-confetti';
const confetti = ((confettiNamespace as any).default || confettiNamespace) as typeof confettiNamespace;

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent implements OnInit {
  goals: FinancialGoal[] = [];
  loading = true;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  showModal = false;
  editingId: string | null = null;
  goalForm: FormGroup;
  isSubmitting = false;

  showContributeModal = false;
  contributingGoal: FinancialGoal | null = null;
  contributeAmount = 100;
  isContributing = false;

  showCelebrationModal = false;
  completedGoalName = '';

  popularTemplates = [
    { name: 'Buy Laptop', amount: 1500, category: 'Tech' },
    { name: 'Emergency Fund', amount: 5000, category: 'Savings' },
    { name: 'Vacation Trip', amount: 2500, category: 'Travel' },
    { name: 'Buy Bike', amount: 800, category: 'Vehicle' },
    { name: 'House Down Payment', amount: 20000, category: 'Real Estate' }
  ];

  categories = ['Savings', 'Tech', 'Travel', 'Vehicle', 'Real Estate', 'Education', 'Investment', 'Other'];

  constructor(
    private goalService: GoalService,
    private fb: FormBuilder
  ) {
    const defaultDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    this.goalForm = this.fb.group({
      name: ['', Validators.required],
      targetAmount: ['', [Validators.required, Validators.min(1)]],
      currentAmount: [0, [Validators.min(0)]],
      category: ['Savings'],
      deadline: [defaultDate, Validators.required]
    });
  }

  ngOnInit() {
    this.loadGoals();
  }

  loadGoals() {
    this.loading = true;
    this.goalService.getGoals().subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.success) {
          this.goals = res.data || [];
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading goals:', err);
      }
    });
  }

  openCreateModal(template?: { name: string; amount: number; category: string }) {
    this.editingId = null;
    const defaultDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    this.goalForm.reset({
      name: template?.name || '',
      targetAmount: template?.amount || '',
      currentAmount: 0,
      category: template?.category || 'Savings',
      deadline: defaultDate
    });
    this.showModal = true;
  }

  openEditModal(goal: FinancialGoal) {
    this.editingId = goal.id;
    this.goalForm.patchValue({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      category: goal.category || 'Savings',
      deadline: new Date(goal.deadline).toISOString().substring(0, 10)
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingId = null;
  }

  saveGoal() {
    if (this.goalForm.invalid) return;

    this.isSubmitting = true;
    const formVal = this.goalForm.value;

    if (this.editingId) {
      this.goalService.updateGoal(this.editingId, formVal).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showToast('Goal updated successfully');
          this.closeModal();
          this.loadGoals();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.message || 'Failed to update goal';
        }
      });
    } else {
      this.goalService.createGoal(formVal).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showToast('Financial goal created successfully');
          this.closeModal();
          this.loadGoals();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.message || 'Failed to create goal';
        }
      });
    }
  }

  openContributeModal(goal: FinancialGoal) {
    this.contributingGoal = goal;
    this.contributeAmount = 100;
    this.showContributeModal = true;
  }

  closeContributeModal() {
    this.showContributeModal = false;
    this.contributingGoal = null;
  }

  submitContribution() {
    if (!this.contributingGoal || this.contributeAmount <= 0) return;

    this.isContributing = true;
    const goalId = this.contributingGoal.id;
    const goalName = this.contributingGoal.name;

    this.goalService.contribute(goalId, this.contributeAmount).subscribe({
      next: (res) => {
        this.isContributing = false;
        this.closeContributeModal();
        this.loadGoals();

        if (res && res.data && res.data.completed) {
          this.celebrateGoalCompletion(goalName);
        } else {
          this.showToast(`Deposited $${this.contributeAmount} to "${goalName}"`);
        }
      },
      error: () => {
        this.isContributing = false;
        this.errorMessage = 'Failed to contribute to goal';
      }
    });
  }

  celebrateGoalCompletion(goalName: string) {
    this.completedGoalName = goalName;
    this.showCelebrationModal = true;

    try {
      // Fire vibrant multi-angle confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    } catch {
      // Graceful fallback if canvas is unavailable
    }
  }

  deleteGoal(id: string) {
    if (!confirm('Are you sure you want to delete this financial goal?')) return;

    this.goalService.deleteGoal(id).subscribe({
      next: () => {
        this.goals = this.goals.filter(g => g.id !== id);
        this.showToast('Goal removed');
      }
    });
  }

  calculateProgress(goal: FinancialGoal): number {
    if (!goal.targetAmount || goal.targetAmount <= 0) return 0;
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }

  calculateDaysLeft(deadline: string): number {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  showToast(msg: string) {
    this.successMessage = msg;
    setTimeout(() => {
      if (this.successMessage === msg) this.successMessage = null;
    }, 4000);
  }

  get totalSaved(): number {
    return this.goals.reduce((sum, g) => sum + g.currentAmount, 0);
  }

  get totalTarget(): number {
    return this.goals.reduce((sum, g) => sum + g.targetAmount, 0);
  }
}
