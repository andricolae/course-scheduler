import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { LogCategory } from '../log.model';
import * as LogActions from '../../state/logs/log.actions';

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
  private store = inject(Store, { optional: true });

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.userSub = this.authService.user.subscribe(user => {
      this.isAuthenticated = !!user;
      this.userRole = user?.role ?? null;
      this.isAdmin = user?.role === 'Admin';
      this.logNavAction('AUTH_STATE_CHANGED', {
        isAuthenticated: this.isAuthenticated,
        role: this.userRole
      });
    });
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
  }

  navigateTo(route: string) {
    this.logNavAction('NAVIGATION_INITIATED', { route });
    this.router.navigate([route]);
  }

  logout() {
    this.logNavAction('LOGOUT_INITIATED');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private logNavAction(action: string, details?: any): void {
    this.store!.dispatch(LogActions.addLog({
      log: {
        timestamp: Date.now(),
        userId: this.authService.user.value?.id,
        userRole: this.authService.user.value?.role,
        category: LogCategory.NAVIGATION,
        action,
        details
      }
    }));
  }
}
