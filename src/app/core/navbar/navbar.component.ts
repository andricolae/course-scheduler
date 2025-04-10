import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isAuthenticated = false;
  isAdmin = false;
  isTeacher = false;
  isStudent = false;
  userRole: string | null = null;
  private userSub!: Subscription;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.userSub = this.authService.user.subscribe(user => {
      console.log('Auth service user value:', user);
      this.isAuthenticated = !!user;
      this.userRole = user?.role ?? null;
      this.isAdmin = user?.role === 'Admin';

      console.log('Is authenticated:', this.isAuthenticated);
      console.log('Is admin:', this.isAdmin);
    });
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
