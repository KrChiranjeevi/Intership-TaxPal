import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  userName = 'User';
  userInitials = 'U';

  constructor(private router: Router) {}

  ngOnInit() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userName = user.name || user.username || user.email || 'User';
        this.userInitials = this.userName.substring(0, 2).toUpperCase();
      } catch { 
        this.userName = 'User'; 
        this.userInitials = 'U';
      }
    }
  }



  onLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  closeModals() {}
}
