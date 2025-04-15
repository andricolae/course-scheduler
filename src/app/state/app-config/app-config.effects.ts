import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { AppConfigService } from '../../core/services/app-config.service';
import * as AppConfigActions from './app-config.actions';
import { NotificationComponent } from '../../core/notification/notification.component';

@Injectable()
export class AppConfigEffects {
  constructor(
    private actions$: Actions,
    private appConfigService: AppConfigService
  ) {}

  loadAppConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppConfigActions.loadAppConfig),
      mergeMap(() =>
        this.appConfigService.getAppConfig().pipe(
          map(config => AppConfigActions.loadAppConfigSuccess({ config })),
          catchError(error => of(AppConfigActions.loadAppConfigFailure({ error: error.message })))
        )
      )
    )
  );

  updateAppConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppConfigActions.updateAppConfig),
      mergeMap(({ config }) =>
        this.appConfigService.saveAppConfig(config).pipe(
          map(() => {
            NotificationComponent.show('success', 'App configuration updated successfully');
            return AppConfigActions.updateAppConfigSuccess({ config });
          }),
          catchError(error => {
            NotificationComponent.show('alert', `Failed to update configuration: ${error.message}`);
            return of(AppConfigActions.updateAppConfigFailure({ error: error.message }));
          })
        )
      )
    )
  );

  toggleScheduleOverlapSetting$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppConfigActions.toggleScheduleOverlapSetting),
      switchMap(({ allowOverlap }) =>
        of(AppConfigActions.updateAppConfig({
          config: { allowTeacherScheduleOverlap: allowOverlap }
        }))
      )
    )
  );
}
