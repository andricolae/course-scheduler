import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { UnauthorizedComponent } from './core/unauthorized.component';
import { HomeComponent } from './core/home.component';
import { roleGuard } from './core/guards/role.guards';
import { SchedulerComponent } from './scheduler/scheduler.component';
import { LogViewerComponent } from './core/log-viewer/log-viewer.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin/scheduler', component: SchedulerComponent, canActivate: [roleGuard(['Admin'])] },
  { path: 'admin/logs', component: LogViewerComponent, canActivate: [roleGuard(['Admin'])] },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];
