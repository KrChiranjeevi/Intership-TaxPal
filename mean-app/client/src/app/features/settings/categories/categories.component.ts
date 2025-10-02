import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>{{ data.mode === 'edit' ? 'Edit Category' : 'Add Category' }}</h2>
    <div>
      <input [(ngModel)]="categoryName" placeholder="Enter category name" class="input-box"/>
    </div>
    <div class="dialog-actions">
      <button (click)="onCancel()">Cancel</button>
      <button (click)="onSave()">{{ data.mode === 'edit' ? 'Save' : 'Add' }}</button>
    </div>
  `,
  styles: [`
    h2 {
      font-size: 18px;
      margin-bottom: 12px;
      color: #fff;
    }
    .input-box {
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      border: none;
      background: #2d3d52;
      color: white;
      outline: none;
    }
    .dialog-actions {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    button {
      background: #2563eb;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      color: #fff;
      cursor: pointer;
    }
    button:first-child {
      background: #6b6969;
    }
  `]
})
export class CategoryDialogComponent {
  categoryName: string = '';

  constructor(
    public dialogRef: MatDialogRef<CategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data?.name) this.categoryName = data.name;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.categoryName.trim()) {
      this.dialogRef.close(this.categoryName.trim());
    }
  }
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, MatDialogModule, CategoryDialogComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent {
  activeTab: 'expenses' | 'income' = 'expenses';

  expenseCategories = [
    { name: 'Business Expenses', color: '#e74c3c' },
    { name: 'Office Rent', color: '#3498db' },
    { name: 'Software Subscriptions', color: '#9b59b6' },
    { name: 'Professional Development', color: '#27ae60' },
    { name: 'Marketing', color: '#f39c12' },
    { name: 'Travel', color: '#e67e22' },
    { name: 'Meals & Entertainment', color: '#8e44ad' },
    { name: 'Utilities', color: '#2ecc71' }
  ];

  incomeCategories = [
    { name: 'Salary', color: '#1abc9c' },
    { name: 'Freelance Work', color: '#3498db' },
    { name: 'Investment Returns', color: '#9b59b6' },
    { name: 'Business Revenue', color: '#e67e22' },
    { name: 'Rental Income', color: '#f39c12' }
  ];

  constructor(private dialog: MatDialog) {}

  switchTab(tab: 'expenses' | 'income') {
    this.activeTab = tab;
  }

  get categories() {
    return this.activeTab === 'expenses' ? this.expenseCategories : this.incomeCategories;
  }

  addCategory() {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '300px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categories.push({ name: result, color: '#5c7ad5' });
      }
    });
  }

  editCategory(index: number) {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '300px',
      data: { mode: 'edit', name: this.categories[index].name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categories[index].name = result;
      }
    });
  }

  deleteCategory(index: number) {
    const confirmDelete = confirm(`Delete "${this.categories[index].name}"?`);
    if (confirmDelete) {
      this.categories.splice(index, 1);
    }
  }
}
