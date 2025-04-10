import { createAction, props } from '@ngrx/store';
import { Course, CourseSession } from '../../core/user.model';

export const loadPendingCourses = createAction(
  '[Scheduler] Load Pending Courses'
);

export const loadPendingCoursesSuccess = createAction(
  '[Scheduler] Load Pending Courses Success',
  props<{ courses: Course[] }>()
);

export const loadPendingCoursesFail = createAction(
  '[Scheduler] Load Pending Courses Fail',
  props<{ error: string }>()
);

export const submitSchedule = createAction(
  '[Scheduler] Submit Schedule',
  props<{ courseId: string, sessions: CourseSession[] }>()
);

export const submitScheduleSuccess = createAction(
  '[Scheduler] Submit Schedule Success',
  props<{ courseId: string }>()
);

export const submitScheduleFail = createAction(
  '[Scheduler] Submit Schedule Fail',
  props<{ error: string }>()
);

export const checkScheduleConflicts = createAction(
  '[Scheduler] Check Schedule Conflicts',
  props<{ sessions: CourseSession[] }>()
);

export const checkScheduleConflictsSuccess = createAction(
  '[Scheduler] Check Schedule Conflicts Success',
  props<{ conflicts: any[] }>()
);

export const checkScheduleConflictsFail = createAction(
  '[Scheduler] Check Schedule Conflicts Fail',
  props<{ error: string }>()
);

export const addCourseSession = createAction(
  '[Scheduler] Add Course Session',
  props<{ courseId: string, session: CourseSession }>()
);

export const addRecurringSessions = createAction(
  '[Scheduler] Add Recurring Sessions',
  props<{ courseId: string, sessions: CourseSession[] }>()
);

export const updateCourseSession = createAction(
  '[Scheduler] Update Course Session',
  props<{ courseId: string, sessionId: string, session: CourseSession }>()
);

export const deleteCourseSession = createAction(
  '[Scheduler] Delete Course Session',
  props<{ courseId: string, sessionId: string }>()
);
