import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./core/navbar/navbar.component";
import { NotificationComponent } from "./core/notification/notification.component";
import { CoursesEffects } from './state/courses/course.effects';
import { NavigationInterceptor } from './core/navigation.interceptor';
import { LoggingService } from './core/services/logging.service';
import { Store } from '@ngrx/store';
import { LogCategory } from './core/log.model';
import * as LogActions from './state/logs/log.actions';

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, RouterOutlet, NotificationComponent],
  providers: [CoursesEffects],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Course Scheduler';
  private store = inject(Store, { optional: true });

  constructor(
    private loggingService: LoggingService,
    private navigationInterceptor: NavigationInterceptor,
  ) {}

  ngOnInit() {
    this.store!.dispatch(LogActions.addLog({
      log: {
        timestamp: Date.now(),
        category: LogCategory.SYSTEM,
        action: 'APPLICATION_STARTUP',
        details: {
          userAgent: navigator.userAgent,
          appVersion: '1.0.0',
          timestamp: new Date().toISOString()
        }
      }
    }));

    this.navigationInterceptor;

    this.setupErrorLogging();
  }

  private setupErrorLogging() {
    const originalErrorHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      this.store!.dispatch(LogActions.addLog({
        log: {
          timestamp: Date.now(),
          category: LogCategory.SYSTEM,
          action: 'UNCAUGHT_ERROR',
          details: {
            message,
            source,
            lineno,
            colno,
            stack: error?.stack
          }
        }
      }));

      if (typeof originalErrorHandler === 'function') {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };
  }
}
