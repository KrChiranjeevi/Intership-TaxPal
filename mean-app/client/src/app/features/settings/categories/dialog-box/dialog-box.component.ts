import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialog-box.component.html',
  styleUrls: ['./dialog-box.component.scss']
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
