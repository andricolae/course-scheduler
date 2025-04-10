import { Component } from '@angular/core';
import { UserModel } from '../../core/user.model';
import * as UserActions from '../../state/users/user.actions';
import * as CourseActions from '../../state/courses/course.actions'
import { Store } from '@ngrx/store';
import { selectAllUsers } from '../../state/users/user.selector';
import { SpinnerService } from '../../core/services/spinner.service';
import { SpinnerComponent } from "../../core/spinner/spinner.component";
import { v4 as uuidv4 } from 'uuid';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { selectAllCourses } from '../../state/courses/course.selector';
import { combineLatest, Subscription } from 'rxjs';
import { WeeklyScheduleComponent } from '../student-dash/weekly-schedule/weekly-schedule.component';

@Component({
  selector: 'app-teacher-dash',
  standalone: true,
  templateUrl: './teacher-dash.component.html',
  styleUrl: './teacher-dash.component.css',
  imports: [SpinnerComponent, NgClass, DatePipe, FormsModule, WeeklyScheduleComponent],
})
export class TeacherDashComponent {
  teacherName = '';
  activeTab: 'grades' | 'attendance' = 'grades';
  selectedCourse: string | null = null;
  isAddGradeModalOpen = false;
  currentDate = new Date();

  newGrade: {
    courseId: null;
    studentId: null;
    title: '';
    value: 0;
    date: string;
  } = {
    courseId: null,
    studentId: null,
    title: '',
    value: 0,
    date: new Date().toISOString().split('T')[0]
  };

  currentUser: UserModel | null = null;

  myCourses: any[] = [];

  selectedCourseObj: any = null;

  selectedAttendanceCourse: string | null = null;
  selectedGradesCourse: string | null = null;

  private userSubscription: Subscription | null = null;
  private coursesSubscription: Subscription | null = null;

  users$ = this.store.select(selectAllUsers);
  courses$ = this.store.select(selectAllCourses);

  loggedUser: UserModel = { fullName: 'loading', role: 'loading', email: 'loading' };

  constructor(private store: Store, private spinner: SpinnerService) {}
  ngOnInit() {
    this.spinner.show();

    this.spinner.show();
    this.store.dispatch(CourseActions.loadCourses());
    this.store.dispatch(UserActions.loadUsers());

    this.userSubscription = this.users$.subscribe(users => {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        this.currentUser = users.find(user => user.email === parsedUser.email) || null;

        if (this.currentUser) {
          this.teacherName = this.currentUser.fullName;
        }
      }
    });

    this.coursesSubscription = combineLatest([this.courses$, this.users$]).subscribe(([courses, users]) => {
      if (this.currentUser?.id) {
        this.myCourses = courses
          .filter(course => course.teacherId === this.currentUser?.id || course.teacher === this.currentUser?.fullName)
          .map(course => {
            const students = course.enrolledStudents?.map(studentId => {
              const student = users.find(u => u.id === studentId);

              const grades = course.studentGrades && course.studentGrades[studentId]
                ? [...course.studentGrades[studentId]]
                : [];

              const attendance: { sessionId: string; present: boolean | undefined; }[] = [];
              if (course.sessions && course.sessions.length > 0) {
                course.sessions.forEach(session => {
                  const isPresent = course.studentAttendance &&
                                    course.studentAttendance[studentId] &&
                                    course.studentAttendance[studentId][session.id] === true;

                  attendance.push({
                    sessionId: session.id,
                    present: isPresent
                  });
                });
              }

              return {
                id: studentId,
                name: student?.fullName || 'Unknown Student',
                email: student?.email || '',
                grades: grades,
                attendance: attendance
              };
            }) || [];

            return {
              ...course,
              students: students
            };
          });
      }

      this.spinner.hide();
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.coursesSubscription) {
      this.coursesSubscription.unsubscribe();
    }
  }

  toggleView(courseName: string) {
    this.selectedCourse = this.selectedCourse === courseName ? null : courseName;
    this.selectedCourseObj = this.myCourses.find(course => course.name === this.selectedCourse);
    this.activeTab = 'grades';
  }

  calculateMeanGrade(grades: any[]): number {
    if (!grades || grades.length === 0) return 0;
    const sum = grades.reduce((total, grade) => total + grade.value, 0);
    return parseFloat((sum / grades.length).toFixed(1));
  }

  isStudentPresent(student: any, session: any): boolean {
    const attendanceRecord = student.attendance.find((a: any) => a.sessionId === session.id);
    return attendanceRecord ? attendanceRecord.present : false;
  }

  getAttendanceStatus(student: any, session: any): string {
    return this.isStudentPresent(student, session) ? 'Present' : 'Absent';
  }

  getAttendanceStatusClass(student: any, session: any): string {
    return this.isStudentPresent(student, session)
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }

  openAddGradeModal(course: any) {
    this.newGrade = {
      courseId: course.id,
      studentId: null,
      title: '',
      value: 0,
      date: new Date().toISOString().split('T')[0]
    };
    this.isAddGradeModalOpen = true;
  }

  closeAddGradeModal() {
    this.isAddGradeModalOpen = false;
  }

  isNewGradeValid(): boolean {
    return this.newGrade.studentId !== null &&
      this.newGrade.title.trim() !== '' &&
      this.newGrade.value >= 0 &&
      this.newGrade.value <= 10;
  }

  toggleAttendance(courseId: string, studentId: string, sessionId: string): void {
    this.spinner.show();

    const course = this.myCourses.find(c => c.id === courseId);
    if (course) {
      const student = course.students.find((s: { id: string; }) => s.id === studentId);
      if (student) {
        const attendanceRecord = student.attendance.find((a: { sessionId: string; }) => a.sessionId === sessionId);
        const newPresent = attendanceRecord ? !attendanceRecord.present : true;

        this.store.dispatch(CourseActions.updateStudentAttendance({
          courseId,
          studentId,
          sessionId,
          present: newPresent
        }));

        if (attendanceRecord) {
          attendanceRecord.present = newPresent;
        } else {
          student.attendance.push({ sessionId, present: newPresent });
        }
      }
    }

    this.spinner.hide();
  }

  saveNewGrade() {
    if (!this.isNewGradeValid() || !this.newGrade.courseId || !this.newGrade.studentId) {
      return;
    }

    this.spinner.show();

    const grade = {
      title: this.newGrade.title,
      value: this.newGrade.value,
      date: this.newGrade.date
    };

    this.store.dispatch(CourseActions.addStudentGrade({
      courseId: this.newGrade.courseId,
      studentId: this.newGrade.studentId,
      grade
    }));

    const course = this.myCourses.find(c => c.id === this.newGrade.courseId);
    if (course) {
      const student = course.students.find((s: { id: null; }) => s.id === this.newGrade.studentId);
      if (student) {
        if (!student.grades) {
          student.grades = [];
        }

        student.grades.push({
          id: 'temp-' + uuidv4(),
          ...grade
        });
      }
    }

    this.closeAddGradeModal();
    this.spinner.hide();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
