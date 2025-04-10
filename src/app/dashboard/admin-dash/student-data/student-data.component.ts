import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable } from 'rxjs';
import { Course } from '../../../core/user.model';
import { SpinnerService } from '../../../core/services/spinner.service';
import * as CourseSelectors from '../../../state/courses/course.selector';
import * as UserSelectors from '../../../state/users/user.selector';
import { AsyncPipe } from '@angular/common';
import { SpinnerComponent } from '../../../core/spinner/spinner.component';

@Component({
  selector: 'app-student-data',
  imports: [AsyncPipe, SpinnerComponent],
  templateUrl: './student-data.component.html',
  styleUrl: './student-data.component.css'
})
export class StudentDataComponent {
  @Input() courseId!: string;

  activeTab: 'grades' | 'attendance' = 'grades';
  course$: Observable<Course | undefined>;
  students$: Observable<any[]>;

  constructor(
    private store: Store,
    private spinner: SpinnerService
  ) {
    // Initialize with empty observables - will be properly set in ngOnInit
    this.course$ = this.store.select(CourseSelectors.selectCourseById(''));
    this.students$ = combineLatest([
      this.store.select(CourseSelectors.selectCourseById('')),
      this.store.select(UserSelectors.selectAllUsers)
    ]).pipe(
      map(([course, users]) => {
        if (!course || !course.enrolledStudents) return [];

        return course.enrolledStudents.map(studentId => {
          const student = users.find(u => u.id === studentId);

          // Get student grades
          const grades = course.studentGrades && course.studentGrades[studentId]
            ? [...course.studentGrades[studentId]]
            : [];

          // Get attendance info
          const attendanceMap = course.studentAttendance?.[studentId] || {};
          const attendanceCount = Object.values(attendanceMap).filter(Boolean).length;
          const sessionsCount = course.sessions?.length || 0;
          const attendanceRate = sessionsCount > 0
            ? Math.round((attendanceCount / sessionsCount) * 100)
            : 0;

          return {
            id: studentId,
            fullName: student?.fullName || 'Unknown Student',
            email: student?.email || 'Unknown Email',
            grades,
            attendanceCount,
            sessionsCount,
            attendanceRate,
            attendanceDetails: course.sessions?.map(session => ({
              session,
              present: attendanceMap[session.id] || false
            })) || []
          };
        });
      })
    );
  }

  ngOnInit(): void {
    this.spinner.show();
    // Re-initialize observables with courseId from @Input
    this.course$ = this.store.select(CourseSelectors.selectCourseById(this.courseId));
    this.students$ = combineLatest([
      this.store.select(CourseSelectors.selectCourseById(this.courseId)),
      this.store.select(UserSelectors.selectAllUsers)
    ]).pipe(
      map(([course, users]) => {
        if (!course || !course.enrolledStudents) return [];

        return course.enrolledStudents.map(studentId => {
          const student = users.find(u => u.id === studentId);

          // Get student grades
          const grades = course.studentGrades && course.studentGrades[studentId]
            ? [...course.studentGrades[studentId]]
            : [];

          // Get attendance info
          const attendanceMap = course.studentAttendance?.[studentId] || {};
          const attendanceCount = Object.values(attendanceMap).filter(Boolean).length;
          const sessionsCount = course.sessions?.length || 0;
          const attendanceRate = sessionsCount > 0
            ? Math.round((attendanceCount / sessionsCount) * 100)
            : 0;

          return {
            id: studentId,
            fullName: student?.fullName || 'Unknown Student',
            email: student?.email || 'Unknown Email',
            grades,
            attendanceCount,
            sessionsCount,
            attendanceRate,
            attendanceDetails: course.sessions?.map(session => ({
              session,
              present: attendanceMap[session.id] || false
            })) || []
          };
        });
      })
    );

    setTimeout(() => {
      this.spinner.hide();
    }, 500);
  }

  calculateMeanGrade(grades: any[]): number {
    if (!grades || grades.length === 0) return 0;
    const sum = grades.reduce((total, grade) => total + grade.value, 0);
    return parseFloat((sum / grades.length).toFixed(1));
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
