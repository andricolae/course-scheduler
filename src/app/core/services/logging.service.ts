import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { LogCategory, LogEntry } from '../log.model';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { User } from '../user.model';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private logsCollection;
  private currentUser: User | null = null;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router
  ) {
    this.logsCollection = collection(this.firestore, 'logs');

    this.authService.user.subscribe(user => {
      this.currentUser = user;
    });

    this.setupNavigationLogging();
  }

  logAction(category: LogCategory, action: string, details?: any): void {
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      userId: this.currentUser?.id,
      userRole: this.currentUser?.role,
      category,
      action,
      details: this.sanitizeLogDetails(details)
    };

    addDoc(this.logsCollection, logEntry)
      .catch(error => console.error('Error writing log to Firebase:', error));
  }

  logAuth(action: string, details?: any): void {
    this.logAction(LogCategory.AUTH, action, details);
  }

  logNavigation(action: string, details?: any): void {
    this.logAction(LogCategory.NAVIGATION, action, details);
  }

  logScheduler(action: string, details?: any): void {
    this.logAction(LogCategory.SCHEDULER, action, details);
  }

  logSystem(action: string, details?: any): void {
    this.logAction(LogCategory.SYSTEM, action, details);
  }

  private setupNavigationLogging(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.logNavigation('PAGE_NAVIGATION', { url: event.urlAfterRedirects });
    });
  }

  private sanitizeLogDetails(details: any): any {
    if (!details) return null;

    try {
      const sanitized = JSON.parse(JSON.stringify(details));

      const truncateStringValues = (obj: any) => {
        if (!obj) return obj;

        if (typeof obj === 'object') {
          for (const key in obj) {
            if (typeof obj[key] === 'string' && obj[key].length > 500) {
              obj[key] = obj[key].substring(0, 500) + '... [truncated]';
            } else if (typeof obj[key] === 'object') {
              obj[key] = truncateStringValues(obj[key]);
            }
          }
        }
        return obj;
      };

      return truncateStringValues(sanitized);
    } catch (error) {
      return {
        error: 'Could not serialize log details',
        type: typeof details,
        summary: details ? details.toString().substring(0, 100) : null
      };
    }
  }
}
