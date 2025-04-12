import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';

import * as SchedulerActions from './scheduler.actions';
import { SchedulerApiService } from '../../core/services/scheduler-api.service';
import { NotificationComponent } from '../../core/notification/notification.component';

@Injectable()
export class SchedulerEffects {
  constructor(
    private actions$: Actions,
    private schedulerApiService: SchedulerApiService
  ) {}

  loadPendingCourses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SchedulerActions.loadPendingCourses),
      mergeMap(() =>
        this.schedulerApiService.getPendingCourses().pipe(
          map(response => {
            const courses = response.courses || response.success ? response.courses : [];
            return SchedulerActions.loadPendingCoursesSuccess({ courses });
          }),
          catchError(error => {
            console.error('Error loading pending courses:', error);
            NotificationComponent.show(error, 'Failed to load pending courses');
            return of(SchedulerActions.loadPendingCoursesFailure({ error }));
          })
        )
      )
    )
  );

  // submitSchedule$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(SchedulerActions.submitSchedule),
  //     mergeMap(({ courseId, sessions }) =>
  //       this.schedulerApiService.submitSchedule(courseId, sessions).pipe(
  //         map((response) => {
  //           NotificationComponent.show('success', 'Course schedule saved successfully');
  //           return SchedulerActions.submitScheduleSuccess({ courseId });
  //         }),
  //         catchError(error => {
  //           NotificationComponent.show('alert', `Failed to save schedule: ${error.message}`);
  //           return of(SchedulerActions.submitScheduleFail({ error: error.message }));
  //         })
  //       )
  //     )
  //   )
  // );

  submitSchedule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SchedulerActions.submitSchedule),
      mergeMap(({ courseId, sessions }) =>
        this.schedulerApiService.submitSchedule(courseId, sessions).pipe(
          map(() => {
            NotificationComponent.show('success', 'Course schedule saved successfully');
            return SchedulerActions.submitScheduleSuccess({ courseId });
          }),
          catchError(error => {
            NotificationComponent.show('alert', `Failed to save schedule: ${error.message || 'Unknown error'}`);
            return of(SchedulerActions.submitScheduleFail({
              error: error.message || 'Unknown error occurred while saving schedule'
            }));
          })
        )
      )
    )
  );

  // reloadCoursesAfterSubmit$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(SchedulerActions.submitScheduleSuccess),
  //     map(() => {
  //       return CourseActions.loadCourses();
  //     })
  //   )
  // );

  checkScheduleConflicts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SchedulerActions.checkScheduleConflicts),
      mergeMap(({ sessions }) =>
        this.schedulerApiService.checkConflicts(sessions).pipe(
          map(conflicts => SchedulerActions.checkScheduleConflictsSuccess({ conflicts })),
          catchError(error =>
            of(SchedulerActions.checkScheduleConflictsFail({ error: error.message }))
          )
        )
      )
    )
  );
}
