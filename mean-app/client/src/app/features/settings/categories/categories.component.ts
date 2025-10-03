import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-container">
      <h2>{{ data.mode === 'edit' ? 'Edit' : 'Add New' }} {{ data.type | titlecase }} Category</h2>

      <div class="form-group">
        <label for="categoryName">Category Name</label>
        <input
          id="categoryName"
          [(ngModel)]="categoryName"
          placeholder="Enter category name"
          class="input-box"
        />
      </div>

      <div class="form-group">
        <label>Category Color</label>
        <div class="color-options">
          <span
            *ngFor="let color of predefinedColors"
            class="color-circle"
            [ngStyle]="{'background-color': color, 'border': categoryColor === color ? '2px solid #fff' : 'none'}"
            (click)="categoryColor = color"
          ></span>
        </div>
      </div>

      <div class="dialog-actions">
        <button (click)="onCancel()">Cancel</button>
        <button (click)="onSave()">{{ data.mode === 'edit' ? 'Save' : 'Add' }}</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 25px;
      width: 400px;
      background: #1f2a38;
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    h2 {
      font-size: 20px;
      margin-bottom: 12px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    label {
      font-weight: 500;
      color: #ccc;
    }

    .input-box {
      padding: 10px;
      border-radius: 10px;
      border: none;
      outline: none;
      background: #2d3d52;
      color: #fff;
    }

    .color-options {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .color-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s, border 0.2s;
    }

    .color-circle:hover {
      transform: scale(1.1);
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 10px;
    }

    button {
      padding: 6px 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }

    button:first-child {
      background: #6b6969;
      color: #fff;
    }

    button:last-child {
      background: #2563eb;
      color: #fff;
    }
  `]
})
export class CategoryDialogComponent {
  categoryName: string = '';
  categoryColor: string = '#5c7ad5';
  predefinedColors: string[] = ['#2563eb', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c'];

  constructor(
    public dialogRef: MatDialogRef<CategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data?.name) this.categoryName = data.name;
    if (data?.color) this.categoryColor = data.color;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.categoryName.trim()) {
      this.dialogRef.close({ name: this.categoryName.trim(), color: this.categoryColor });
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
      width: '450px',
      data: { mode: 'add', type: this.activeTab }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categories.push({ name: result.name, color: result.color });
      }
    });
  }

  editCategory(index: number) {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '450px',
      data: { 
        mode: 'edit', 
        type: this.activeTab, 
        name: this.categories[index].name, 
        color: this.categories[index].color 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categories[index].name = result.name;
        this.categories[index].color = result.color;
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
