import { Course } from './../../core/user.model';
import { createReducer, on } from '@ngrx/store';
import * as CourseActions from './course.actions';

export interface CoursesState {
    courses: Course[];
    loading: boolean;
    error: string | null;
}

const initialState: CoursesState = {
    courses: [],
    loading: false,
    error: null
};

export const coursesReducer = createReducer(
    initialState,
    on(CourseActions.loadCourses, state => ({ ...state, loading: true })),

    on(CourseActions.loadCoursesSuccess, (state, { courses }) => ({
        ...state,
        courses,
        loading: false
    })),

    on(CourseActions.loadCoursesFail, (state, { error }) => ({
        ...state,
        error,
        loading: false
    })),

    on(CourseActions.addCourse, CourseActions.addCourse, state => ({
      ...state,
      loading: true
  })),

    on(CourseActions.addCourseSuccess, (state, { course }) => ({
        ...state,
        courses: [...state.courses, course],
        loading: false
    })),

    on(CourseActions.addCourseFail, (state, { error }) => ({
      ...state,
      error,
      loading: false
    })),

    on(CourseActions.updateCourse, state => ({
      ...state,
      loading: true
    })),

    on(CourseActions.updateCourseSuccess, (state, { course }) => ({
      ...state,
      courses: state.courses.map(c => c.id === course.id ? course : c),
      loading: false
    })),

    on(CourseActions.updateCourseFail, (state, { error }) => ({
      ...state,
      error,
      loading: false
    })),

    on(CourseActions.deleteCourse, state => ({
      ...state,
      loading: true
    })),

    on(CourseActions.deleteCourseSuccess, (state, { courseId }) => ({
        ...state,
        courses: state.courses.filter(c => c.id !== courseId),
        loading: false
    })),

    on(CourseActions.deleteCourseFail, (state, { error }) => ({
      ...state,
      error,
      loading: false
    })),

    on(CourseActions.enrollStudentSuccess, (state, { courseId, studentId }) => ({
      ...state,
      courses: state.courses.map(course => {
          if (course.id === courseId) {
              const enrolledStudents = course.enrolledStudents || [];
              if (!enrolledStudents.includes(studentId)) {
                  return {
                      ...course,
                      enrolledStudents: [...enrolledStudents, studentId]
                  };
              }
          }
          return course;
      })
  })),

  on(CourseActions.unenrollStudentSuccess, (state, { courseId, studentId }) => ({
      ...state,
      courses: state.courses.map(course => {
          if (course.id === courseId && course.enrolledStudents) {
              return {
                  ...course,
                  enrolledStudents: course.enrolledStudents.filter(id => id !== studentId)
              };
          }
          return course;
      })
  })),

  on(CourseActions.addStudentGradeSuccess, (state, { courseId, studentId, grade }) => {
    return {
      ...state,
      courses: state.courses.map(course => {
        if (course.id === courseId) {
          const updatedCourse = { ...course };

          if (!updatedCourse.studentGrades) {
            updatedCourse.studentGrades = {};
          }

          updatedCourse.studentGrades = { ...updatedCourse.studentGrades };

          if (!updatedCourse.studentGrades[studentId]) {
            updatedCourse.studentGrades[studentId] = [];
          } else {
            updatedCourse.studentGrades[studentId] = [...updatedCourse.studentGrades[studentId]];
          }

          updatedCourse.studentGrades[studentId].push(grade);

          return updatedCourse;
        }
        return course;
      }),
      loading: false
    };
  }),

  on(CourseActions.updateStudentAttendanceSuccess, (state, { courseId, studentId, sessionId, present }) => {
    return {
      ...state,
      courses: state.courses.map(course => {
        if (course.id === courseId) {
          const updatedCourse = { ...course };

          if (!updatedCourse.studentAttendance) {
            updatedCourse.studentAttendance = {};
          }

          updatedCourse.studentAttendance = { ...updatedCourse.studentAttendance };

          if (!updatedCourse.studentAttendance[studentId]) {
            updatedCourse.studentAttendance[studentId] = {};
          } else {
            updatedCourse.studentAttendance[studentId] = {
              ...updatedCourse.studentAttendance[studentId]
            };
          }

          updatedCourse.studentAttendance[studentId][sessionId] = present;

          return updatedCourse;
        }
        return course;
      }),
      loading: false
    };
  })

);
