import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { HttpResponse, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { firebaseConfig } from '../environment';
import { provideZoneChangeDetection } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { CoursesEffects } from './app/state/courses/course.effects';
import { coursesReducer } from './app/state/courses/course.reducer';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { isDevMode } from '@angular/core';
import { AuthEffects } from './app/state/auth/auth.effects';
import { authReducer } from './app/state/auth/auth.reducer';
import { schedulerReducer } from './app/state/scheduler/scheduler.reducer';
import { SchedulerEffects } from './app/state/scheduler/scheduler.effects';
import { AuthInterceptor } from './app/state/auth/auth.interceptors';
import { logReducer } from './app/state/logs/log.reducer';
import { LogEffects } from './app/state/logs/log.effects';
import { tap } from 'rxjs';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        function loggingInterceptor(req, next) {
          const startTime = Date.now();
          return next(req).pipe(tap({
            next: (event) => {
              if (event instanceof HttpResponse) {
                const duration = Date.now() - startTime;
                console.log(`HTTP ${req.method} ${req.url} completed in ${duration}ms with status ${event.status}`);
              }
            },
            error: (error) => {
              const duration = Date.now() - startTime;
              console.error(`HTTP ${req.method} ${req.url} failed in ${duration}ms with status ${error.status}: ${error.message}`);
            }
          }));
        }
      ])
    ),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(withEventReplay()),
    provideStore({
      courses: coursesReducer,
      auth: authReducer,
      scheduler: schedulerReducer,
      log: logReducer
    }),
    provideEffects([
      CoursesEffects,
      AuthEffects,
      SchedulerEffects,
      LogEffects
    ]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75,
      connectInZone: true
    })
  ],
});
