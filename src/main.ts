import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
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

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch()
      // withInterceptors([AuthInterceptor])
    ),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(withEventReplay()),
    provideStore({
      courses: coursesReducer,
      auth: authReducer,
      scheduler: schedulerReducer
    }),
    provideEffects([
      CoursesEffects,
      AuthEffects,
      SchedulerEffects
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
