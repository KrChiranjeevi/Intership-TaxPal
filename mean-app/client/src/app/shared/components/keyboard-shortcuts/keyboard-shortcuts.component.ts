// src/app/shared/components/keyboard-shortcuts/keyboard-shortcuts.component.ts
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-keyboard-shortcuts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Floating Quick Help Trigger Button -->
    <button class="shortcuts-trigger-btn" (click)="toggleModal()" title="Keyboard Shortcuts (? or Ctrl+/)">
      <span class="material-icons">keyboard</span>
    </button>

    <!-- Modal Backdrop & Dialog -->
    <div class="shortcuts-backdrop" *ngIf="isOpen" (click)="closeModal()">
      <div class="shortcuts-dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <div class="title-with-icon">
            <span class="material-icons">keyboard_command_key</span>
            <h3>Keyboard Shortcuts</h3>
          </div>
          <button class="close-btn" (click)="closeModal()">
            <span class="material-icons">close</span>
          </button>
        </div>

        <p class="dialog-desc">Speed up your financial workflow with global navigation hotkeys.</p>

        <div class="shortcuts-sections">
          <!-- Navigation Hotkeys -->
          <div class="shortcuts-group">
            <h4>Navigation</h4>
            <div class="shortcut-row">
              <span class="action-name">Go to Dashboard</span>
              <div class="keys-combo"><kbd>G</kbd> then <kbd>D</kbd></div>
            </div>
            <div class="shortcut-row">
              <span class="action-name">Go to Transactions</span>
              <div class="keys-combo"><kbd>G</kbd> then <kbd>T</kbd></div>
            </div>
            <div class="shortcut-row">
              <span class="action-name">Go to Budgets</span>
              <div class="keys-combo"><kbd>G</kbd> then <kbd>B</kbd></div>
            </div>
            <div class="shortcut-row">
              <span class="action-name">Go to Recurring</span>
              <div class="keys-combo"><kbd>G</kbd> then <kbd>R</kbd></div>
            </div>
            <div class="shortcut-row">
              <span class="action-name">Go to Financial Goals</span>
              <div class="keys-combo"><kbd>G</kbd> then <kbd>G</kbd></div>
            </div>
            <div class="shortcut-row">
              <span class="action-name">Go to Settings</span>
              <div class="keys-combo"><kbd>G</kbd> then <kbd>S</kbd></div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="shortcuts-group">
            <h4>Application Controls</h4>
            <div class="shortcut-row">
              <span class="action-name">Open / Close Help</span>
              <div class="keys-combo"><kbd>?</kbd> or <kbd>Ctrl</kbd>+<kbd>/</kbd></div>
            </div>
            <div class="shortcut-row">
              <span class="action-name">Close Active Modal</span>
              <div class="keys-combo"><kbd>Esc</kbd></div>
            </div>
            <div class="shortcut-row">
              <span class="action-name">Add New Income</span>
              <div class="keys-combo"><kbd>Alt</kbd>+<kbd>I</kbd></div>
            </div>
            <div class="shortcut-row">
              <span class="action-name">Add New Expense</span>
              <div class="keys-combo"><kbd>Alt</kbd>+<kbd>E</kbd></div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <span>Press <kbd>Esc</kbd> to dismiss this cheat sheet</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shortcuts-trigger-btn {
      position: fixed;
      bottom: 28px;
      left: 28px;
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.2s;

      .material-icons { font-size: 1.25rem; }

      &:hover {
        background: #1e293b;
        color: #38bdf8;
        border-color: rgba(56, 189, 248, 0.3);
        transform: translateY(-2px);
      }
    }

    .shortcuts-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: fadeIn 0.2s ease-out;
      font-family: 'Inter', sans-serif;
    }

    .shortcuts-dialog {
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      width: 90%;
      max-width: 580px;
      padding: 24px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      animation: scaleUp 0.2s ease-out;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .title-with-icon {
      display: flex;
      align-items: center;
      gap: 10px;
      .material-icons { color: #38bdf8; font-size: 1.4rem; }
      h3 { font-size: 1.2rem; font-weight: 700; color: #f1f5f9; margin: 0; }
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      &:hover { color: #f1f5f9; }
    }

    .dialog-desc {
      color: #94a3b8;
      font-size: 0.85rem;
      margin: 0 0 20px;
    }

    .shortcuts-sections {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .shortcuts-group {
      h4 {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
        margin: 0 0 12px;
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
    }

    .shortcut-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 0;
      font-size: 0.85rem;
    }

    .action-name {
      color: #e2e8f0;
    }

    .keys-combo {
      color: #94a3b8;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    kbd {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 2px 6px;
      font-family: monospace;
      font-size: 0.75rem;
      color: #38bdf8;
      box-shadow: 0 2px 0 rgba(0, 0, 0, 0.4);
    }

    .dialog-footer {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center;
      font-size: 0.75rem;
      color: #64748b;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class KeyboardShortcutsComponent {
  isOpen = false;
  private pendingG = false;
  private gTimeout: any = null;

  constructor(private router: Router) {}

  toggleModal(): void {
    this.isOpen = !this.isOpen;
  }

  closeModal(): void {
    this.isOpen = false;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const isInput = target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);

    // Escape closes modal always
    if (event.key === 'Escape') {
      if (this.isOpen) {
        this.closeModal();
        event.preventDefault();
      }
      return;
    }

    // Don't trigger letter shortcuts while typing in forms
    if (isInput) return;

    // Toggle modal on ? or Ctrl+/
    if (event.key === '?' || (event.ctrlKey && event.key === '/')) {
      event.preventDefault();
      this.toggleModal();
      return;
    }

    // Quick Add shortcuts: Alt+I (Income), Alt+E (Expense)
    if (event.altKey && (event.key === 'i' || event.key === 'I')) {
      event.preventDefault();
      this.router.navigate(['/income']);
      return;
    }
    if (event.altKey && (event.key === 'e' || event.key === 'E')) {
      event.preventDefault();
      this.router.navigate(['/expense']);
      return;
    }

    // Two-key navigation: 'g' then...
    const key = event.key.toLowerCase();

    if (key === 'g' && !this.pendingG) {
      this.pendingG = true;
      clearTimeout(this.gTimeout);
      this.gTimeout = setTimeout(() => {
        this.pendingG = false;
      }, 1000);
      return;
    }

    if (this.pendingG) {
      this.pendingG = false;
      clearTimeout(this.gTimeout);

      switch (key) {
        case 'd':
          this.router.navigate(['/dashboard']);
          this.closeModal();
          break;
        case 't':
          this.router.navigate(['/transactions']);
          this.closeModal();
          break;
        case 'b':
          this.router.navigate(['/budget']);
          this.closeModal();
          break;
        case 'r':
          this.router.navigate(['/recurring']);
          this.closeModal();
          break;
        case 'g':
          this.router.navigate(['/goals']);
          this.closeModal();
          break;
        case 's':
          this.router.navigate(['/settings']);
          this.closeModal();
          break;
      }
    }
  }
}
