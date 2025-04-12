import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import * as LogActions from './log.actions';
import { LoggingService } from '../../core/services/logging.service';
import { Firestore, collection, collectionData, limit, orderBy, query } from '@angular/fire/firestore';
import { LogCategory } from '../../core/log.model';

@Injectable()
export class LogEffects {
  constructor(
    private actions$: Actions,
    private firestore: Firestore,
    private loggingService: LoggingService
  ) {}

  addLog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LogActions.addLog),
      tap(({ log }) => {
        this.loggingService.logAction(log.category, log.action, log.details);
      })
    ),
    { dispatch: false }
  );

  loadLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LogActions.loadLogs),
      switchMap(() => {
        const logsCollection = collection(this.firestore, 'logs');

        const logsQuery = query(
          logsCollection,
          orderBy('timestamp', 'desc'),
          limit(1000)
        );

        return from(collectionData(logsQuery, { idField: 'id' })).pipe(
          map(logs => {
            console.log('Fetched logs from Firebase:', logs.length);

            const processedLogs = logs.map(log => ({
              ...log,
              id: log['id'],
              timestamp: log['timestamp'],
              userId: log['userId'],
              userRole: log['userRole'],
              category: log['category'] as LogCategory,
              action: log['action'] as string,
              details: log['details']
            }));

            return LogActions.loadLogsSuccess({ logs: processedLogs });
          }),
          catchError(error => {
            console.error('Error loading logs:', error);
            return of(LogActions.loadLogsFail({ error: error.message }));
          })
        );
      })
    )
  );
}
