import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CategoriesService } from '@core/services/categories.service';
import { CategoryDialogComponent } from './dialog-box/dialog-box.component';

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
      const payload = {
        name: result.name.trim(),
        color: result.color || '#5c7ad5',
        type: this.activeTab
      };

      // 🔍 Check for duplicate (case-insensitive)
      const categoryList = this.activeTab === 'expense' ? this.expenseCategories : this.incomeCategories;
      const isDuplicate = categoryList.some(
        c => c.name.toLowerCase() === payload.name.toLowerCase()
      );

      if (isDuplicate) {
        alert(`"${payload.name}" category already exists in ${this.activeTab} categories!`);
        return;
      }

      // ✅ Add category if not duplicate
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
