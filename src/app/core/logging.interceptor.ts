import { inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { LogCategory } from '../core/log.model';
import * as LogActions from '../state/logs/log.actions';
import { AuthService } from '../core/services/auth.service';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  private store = inject(Store, { optional: true });

  constructor(
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const startTime = Date.now();

    if (this.isFirebaseAuthRequest(request.url)) {
      return next.handle(request);
    }

    const sanitizedRequest = this.sanitizeRequest(request);

    this.logHttpEvent('HTTP_REQUEST_START', sanitizedRequest, undefined, startTime);

    return next.handle(request).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const endTime = Date.now();
            const duration = endTime - startTime;

            const sanitizedResponse = this.sanitizeResponse(event);

            this.logHttpEvent('HTTP_REQUEST_SUCCESS', sanitizedRequest, {
              status: event.status,
              statusText: event.statusText,
              size: this.calculateResponseSize(event),
              duration,
              sanitizedBody: sanitizedResponse
            }, endTime);
          }
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          this.logHttpEvent('HTTP_REQUEST_ERROR', sanitizedRequest, {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            duration
          }, endTime);
        }
      })
    );
  }

  private isFirebaseAuthRequest(url: string): boolean {
    return url.includes('identitytoolkit.googleapis.com') ||
            url.includes('securetoken.googleapis.com');
  }

  private sanitizeRequest(request: HttpRequest<unknown>): any {
    const method = request.method;
    const url = this.sanitizeUrl(request.url);
    const urlWithoutParams = url.split('?')[0];

    const endpoint = urlWithoutParams.split('/').slice(-2).join('/');

    return {
      method,
      endpoint,
      url: urlWithoutParams,
      hasQueryParams: url.includes('?'),
      hasBody: !!request.body
    };
  }

  private sanitizeResponse(response: HttpResponse<any>): any {
    if (!response.body) {
      return null;
    }

    if (Array.isArray(response.body)) {
      return { type: 'array', length: response.body.length };
    }

    if (typeof response.body === 'object') {
      return { type: 'object', keys: Object.keys(response.body) };
    }

    return { type: typeof response.body };
  }

  private sanitizeUrl(url: string): string {
    return url.replace(/key=([^&]+)/g, 'key=REDACTED');
  }

  private calculateResponseSize(response: HttpResponse<any>): string {
    if (!response.body) {
      return '0B';
    }

    try {
      const bodySize = JSON.stringify(response.body).length;

      if (bodySize < 1024) {
        return `${bodySize}B`;
      } else if (bodySize < 1024 * 1024) {
        return `${(bodySize / 1024).toFixed(2)}KB`;
      } else {
        return `${(bodySize / (1024 * 1024)).toFixed(2)}MB`;
      }
    } catch {
      return 'unknown';
    }
  }

  private logHttpEvent(action: string, request: any, response: any, timestamp: number): void {
    this.store!.dispatch(LogActions.addLog({
      log: {
        timestamp,
        userId: this.authService.user.value?.id,
        userRole: this.authService.user.value?.role,
        category: LogCategory.SYSTEM,
        action,
        details: {
          request,
          response
        }
      }
    }));
  }
}
