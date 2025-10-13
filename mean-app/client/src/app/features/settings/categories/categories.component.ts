import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CategoriesService } from '@core/services/categories.service'; // adjust path


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

interface Category {
  id?: string;
  name: string;
  type: 'expense' | 'income';
  color?: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule, HttpClientModule, CategoryDialogComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  activeTab: 'expense' | 'income' = 'expense';
  expenseCategories: Category[] = [];
  incomeCategories: Category[] = [];

  constructor(private dialog: MatDialog, private categoriesService: CategoriesService) {}


  ngOnInit() {
    this.loadCategories();
  }

  switchTab(tab: 'expense' | 'income') {
    this.activeTab = tab;
  }

  get categories() {
    return this.activeTab === 'expense' ? this.expenseCategories : this.incomeCategories;
  }

  loadCategories() {
        this.categoriesService.getCategories().subscribe({
      next: (res) => {
        this.expenseCategories = res.filter(c => c.type === 'expense');
        this.incomeCategories = res.filter(c => c.type === 'income');
      },
      error: (err) => {
        console.error('Error loading categories', err);
        this.expenseCategories = [];
        this.incomeCategories = [];
      }
    });
  }

  addCategory() {
  const dialogRef = this.dialog.open(CategoryDialogComponent, {
    width: '450px',
    data: { mode: 'add', type: this.activeTab }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Ensure all required fields are defined
      const payload: { name: string; color: string; type: 'expense' | 'income' } = {
        name: result.name || '',
        color: result.color || '#5c7ad5', // default color if undefined
        type: this.activeTab
      };

      this.categoriesService.createCategory(payload).subscribe({
      next: (res) => {
        if (this.activeTab === 'expense') this.expenseCategories.push(res);
        else this.incomeCategories.push(res);
      },
      error: (err) => console.error('Error adding category', err)
      });
    }
  });
}


  editCategory(index: number) {
  const category = this.categories[index];
  const dialogRef = this.dialog.open(CategoryDialogComponent, {
    width: '450px',
    data: { mode: 'edit', type: this.activeTab, name: category.name, color: category.color }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result && category.id) {
      // Only send defined fields to avoid Prisma 'undefined' error
      const payload: Partial<{ name: string; color: string }> = {};
      if (result.name !== undefined) payload.name = result.name;
      if (result.color !== undefined) payload.color = result.color;

      this.categoriesService.updateCategory(category.id, payload).subscribe({
  next: (res) => {
    if (payload.name) category.name = payload.name;
    if (payload.color) category.color = payload.color;
  },
  error: (err) => console.error('Error updating category', err)
});

    }
  });
}


  deleteCategory(index: number) {
    const category = this.categories[index];
    const confirmDelete = confirm(`Delete "${category.name}"?`);
    if (confirmDelete && category.id) {
      this.categoriesService.deleteCategory(category.id).subscribe({
  next: () => this.categories.splice(index, 1),
  error: (err) => console.error('Error deleting category', err)
});

    }
  }
}
