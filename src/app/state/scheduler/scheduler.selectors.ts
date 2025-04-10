import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SchedulerState } from './scheduler.reducer';

export const selectSchedulerState = createFeatureSelector<SchedulerState>('scheduler');

export const selectPendingCourses = createSelector(
  selectSchedulerState,
  state => state.pendingCourses
);

export const selectScheduleConflicts = createSelector(
  selectSchedulerState,
  state => state.conflicts
);

export const selectSchedulerLoading = createSelector(
  selectSchedulerState,
  state => state.loading
);

export const selectSchedulerError = createSelector(
  selectSchedulerState,
  state => state.error
);

export const selectPendingCourseById = (courseId: string) => createSelector(
  selectPendingCourses,
  courses => courses.find(course => course.id === courseId)
);
