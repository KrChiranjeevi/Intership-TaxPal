import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  exports: [CommonModule] // ताकि बाकी modules इसे use कर सकें
})
export class SharedModule {}
