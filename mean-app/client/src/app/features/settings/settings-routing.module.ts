import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { ProfileComponent } from './profile/profile.component';
import { CategoriesComponent } from './categories/categories.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { SecurityComponent } from './security/security.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path: 'profile', component: ProfileComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'security', component: SecurityComponent },
      { path: '', redirectTo: 'profile', pathMatch: 'full' } // default
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
