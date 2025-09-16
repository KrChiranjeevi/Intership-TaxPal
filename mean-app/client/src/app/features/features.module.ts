import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// ✅ alias se import
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class FeaturesModule {}
