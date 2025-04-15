import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppConfig } from '../user.model';
import { LogCategory } from '../log.model';
import { Store } from '@ngrx/store';
import * as LogActions from '../../state/logs/log.actions';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private configCollection = 'app-config';
  private configDocId = 'scheduler-settings';

  constructor(
    private firestore: Firestore,
    private store: Store
  ) {}

  getAppConfig(): Observable<AppConfig> {
    const configDocRef = doc(this.firestore, `${this.configCollection}/${this.configDocId}`);

    return from(getDoc(configDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          this.logConfigAction('CONFIG_LOADED');
          return docSnap.data() as AppConfig;
        } else {
          const defaultConfig: AppConfig = {
            allowTeacherScheduleOverlap: false
          };
          this.logConfigAction('DEFAULT_CONFIG_CREATED');
          this.saveAppConfig(defaultConfig).subscribe();
          return defaultConfig;
        }
      }),
      catchError(error => {
        this.logConfigAction('CONFIG_LOAD_ERROR', { error: error.message });
        console.error('Error loading app config:', error);
        return of({
          allowTeacherScheduleOverlap: false
        });
      })
    );
  }

  saveAppConfig(config: AppConfig): Observable<void> {
    const configDocRef = doc(this.firestore, `${this.configCollection}/${this.configDocId}`);
    this.logConfigAction('CONFIG_SAVING', { config });

    return from(setDoc(configDocRef, config, { merge: true })).pipe(
      map(() => {
        this.logConfigAction('CONFIG_SAVED', { config });
      }),
      catchError(error => {
        this.logConfigAction('CONFIG_SAVE_ERROR', { error: error.message });
        console.error('Error saving app config:', error);
        throw error;
      })
    );
  }

  private logConfigAction(action: string, details?: any): void {
    this.store.dispatch(LogActions.addLog({
      log: {
        timestamp: Date.now(),
        category: LogCategory.SYSTEM,
        action: `APP_${action}`,
        details
      }
    }));
  }
}
