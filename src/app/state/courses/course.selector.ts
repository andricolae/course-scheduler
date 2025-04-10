import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CoursesState } from './course.reducer';

export const selectCoursesState = createFeatureSelector<CoursesState>('courses');

export const selectAllCourses = createSelector(
  selectCoursesState,
  (state) => state.courses
);

export const selectCoursesLoading = createSelector(
  selectCoursesState,
  (state) => state.loading
);

export const selectCoursesError = createSelector(
  selectCoursesState,
  (state) => state.error
);

export const selectIsLoading = createSelector(
    selectCoursesState,
  (state) => state.loading
);

export const selectCourseById = (courseId: string) => createSelector(
  selectAllCourses,
  (courses) => courses.find(course => course.id === courseId)
);

export const selectEnrolledCourses = (studentId: string) => createSelector(
  selectAllCourses,
  (courses) => courses.filter(course =>
    course.enrolledStudents && course.enrolledStudents.includes(studentId)
  )
);

export const selectAvailableCourses = createSelector(
  selectAllCourses,
  (courses) => courses
);
