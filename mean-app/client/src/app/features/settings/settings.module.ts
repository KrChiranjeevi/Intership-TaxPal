import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsRoutingModule } from './settings-routing.module';

// ✅ Import all standalone components
import { SettingsComponent } from './settings.component';
import { ProfileComponent } from './profile/profile.component';
import { CategoriesComponent } from './categories/categories.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { SecurityComponent } from './security/security.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SettingsRoutingModule,
    // ✅ Standalone components should be imported here
    SettingsComponent,
    ProfileComponent,
    CategoriesComponent,
    NotificationsComponent,
    SecurityComponent,
  ],
})
export class SettingsModule { }