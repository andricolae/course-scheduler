import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AdminDashComponent } from './dashboard/admin-dash/admin-dash.component';
import { UnauthorizedComponent } from './core/unauthorized.component';
import { HomeComponent } from './core/home.component';
import { roleGuard } from './core/guards/role.guards';
import { SchedulerComponent } from './scheduler/scheduler.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin/scheduler', component: SchedulerComponent, canActivate: [roleGuard(['Admin'])] },
  // { path: 'admin/scheduler', component: SchedulerComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'home', component: HomeComponent },
  { path: '**', redirectTo: '/home' }
];
