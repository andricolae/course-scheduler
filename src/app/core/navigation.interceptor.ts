import { inject, Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { LogCategory } from '../core/log.model';
import * as LogActions from '../state/logs/log.actions';

@Injectable({ providedIn: 'root' })
export class NavigationInterceptor {
  private lastUrl: string = '';
  private store = inject(Store, { optional: true });

  constructor(
    private router: Router,
  ) {
    this.setupNavigationTracking();
  }

  private setupNavigationTracking(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;

      this.store!.dispatch(LogActions.addLog({
        log: {
          timestamp: Date.now(),
          category: LogCategory.NAVIGATION,
          action: 'PAGE_NAVIGATION',
          details: {
            fromUrl: this.lastUrl,
            toUrl: url,
            params: this.getRouteParams(url)
          }
        }
      }));

      this.lastUrl = url;
    });
  }

  private getRouteParams(url: string): any {
    const segments = url.split('/').filter(segment => segment);
    const params: any = {};

    segments.forEach((segment, index) => {
      if (
        (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
        segment.match(/^\d+$/)) &&
        index > 0
      ) {
        const paramName = segments[index - 1];
        if (paramName) {
          params[`${paramName}Id`] = segment;
        }
      }
    });

    return params;
  }
}
