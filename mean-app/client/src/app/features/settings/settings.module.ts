import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsRoutingModule } from './settings-routing.module';

import { SettingsComponent } from './settings.component';
import { ProfileComponent } from './profile/profile.component';
import { CategoriesComponent } from './categories/categories.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { SecurityComponent } from './security/security.component';

@NgModule({
  declarations: [
    SettingsComponent,
    ProfileComponent,
    CategoriesComponent,
    NotificationsComponent,
    SecurityComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SettingsRoutingModule
  ]
})
export class SettingsModule { }
