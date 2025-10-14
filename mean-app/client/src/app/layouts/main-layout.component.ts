import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router'; // import Router

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {

  // inject Router via constructor
  constructor(private router: Router) {}

  onLogout() {
    localStorage.removeItem('token'); // remove your auth token
    this.router.navigate(['/login']);  // navigate to login page
  }
}
