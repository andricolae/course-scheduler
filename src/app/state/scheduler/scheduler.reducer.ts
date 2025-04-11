import { createReducer, on } from '@ngrx/store';
import { Course } from '../../core/user.model';
import * as SchedulerActions from './scheduler.actions';

export interface SchedulerState {
  pendingCourses: Course[];
  conflicts: any[];
  loading: boolean;
  error: string | null;
}

const initialState: SchedulerState = {
  pendingCourses: [],
  conflicts: [],
  loading: false,
  error: null
};

export const schedulerReducer = createReducer(
  initialState,

  on(SchedulerActions.loadPendingCourses, state => ({
    ...state,
    loading: true
  })),

  on(SchedulerActions.loadPendingCoursesSuccess, (state, { courses }) => ({
    ...state,
    pendingCourses: courses,
    loading: false,
    error: null
  })),

  on(SchedulerActions.loadPendingCoursesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(SchedulerActions.submitSchedule, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(SchedulerActions.submitScheduleSuccess, (state, { courseId }) => ({
    ...state,
    pendingCourses: state.pendingCourses.filter(course => course.id !== courseId),
    loading: false,
    error: null
  })),

  on(SchedulerActions.submitScheduleFail, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(SchedulerActions.checkScheduleConflicts, state => ({
    ...state,
    loading: true,
    conflicts: [],
    error: null
  })),

  on(SchedulerActions.checkScheduleConflictsSuccess, (state, { conflicts }) => ({
    ...state,
    conflicts,
    loading: false,
    error: null
  })),

  on(SchedulerActions.checkScheduleConflictsFail, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
