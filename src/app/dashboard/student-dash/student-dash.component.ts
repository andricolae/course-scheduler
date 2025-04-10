import { Component } from '@angular/core';
import * as UserActions from '../../state/users/user.actions';
import * as CourseActions from '../../state/courses/course.actions'
import { Store } from '@ngrx/store';
import { selectAllUsers } from '../../state/users/user.selector';
import { Course, UserModel } from '../../core/user.model';
import { SpinnerService } from '../../core/services/spinner.service';
import { SpinnerComponent } from "../../core/spinner/spinner.component";
import { CourseEnrollmentComponent } from "./course-enrollment/course-enrollment.component";
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import * as CourseSelectors from '../../state/courses/course.selector';
import * as UserSelectors from '../../state/users/user.selector';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { NotificationComponent } from '../../core/notification/notification.component';
import { WeeklyScheduleComponent } from './weekly-schedule/weekly-schedule.component';
import { FormsModule } from '@angular/forms';
interface CourseGrade {
  title: string;
  value: number;
  date: string;
}

interface ClassSession {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  attended: boolean;
}

interface EnrolledCourse {
  id: string;
  name: string;
  teacher: string;
  schedule: string;
  grades: CourseGrade[];
  sessions: {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    attended: boolean;
  }[];
}

@Component({
  selector: 'app-student-dash',
  imports: [SpinnerComponent, CourseEnrollmentComponent, DatePipe, NgClass, WeeklyScheduleComponent, CommonModule, FormsModule],
  templateUrl: './student-dash.component.html',
  styleUrl: './student-dash.component.css'
})
export class StudentDashComponent {
  activeTab: 'grades' | 'attendance' = 'grades';
  selectedCourse: string | null = null;
  isEnrollmentModalOpen = false;

  currentUser$: Observable<UserModel[]> = this.store.select(UserSelectors.selectAllUsers);
  users$ = this.store.select(selectAllUsers);
  loggedUser: UserModel = { fullName: 'loading', role: 'loading', email: 'loading' };

  availableCourses$: Observable<Course[]> = this.store.select(CourseSelectors.selectAllCourses);
  enrolledCourseIds: string[] = [];

  enrolledCourses: EnrolledCourse[] = [];
  currentDate = new Date();
  private userSubscription?: Subscription;
  private courseSubscription?: Subscription;
  private sessionCheckInterval: any;

  constructor(private store: Store, private spinner: SpinnerService) {}

  ngOnInit() {
    this.spinner.show();
    this.store.dispatch(CourseActions.loadCourses());
    this.store.dispatch(UserActions.loadUsers());

    this.userSubscription = this.currentUser$.subscribe(users => {
      if (users.length > 0) {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          this.loggedUser = users.find(user => user.email === parsedData.email) || this.loggedUser;
        }
      }
    });

    this.courseSubscription = combineLatest([this.availableCourses$, this.currentUser$]).subscribe(([courses, users]) => {
      if (courses.length > 0 && this.loggedUser && this.loggedUser.id) {
        this.enrolledCourseIds = courses
          .filter(course => course.enrolledStudents?.includes(this.loggedUser.id!))
          .map(course => course.id!)
          .filter(id => id);

        this.enrolledCourses = courses
          .filter(course => course.enrolledStudents?.includes(this.loggedUser.id!))
          .map(course => {
            const sessions = (course.sessions || []).map(session => {
              const isAttended = !!(course.studentAttendance &&
                              course.studentAttendance[this.loggedUser.id!] &&
                              course.studentAttendance[this.loggedUser.id!][session.id] === true);

              return {
                id: session.id,
                date: new Date(session.date),
                startTime: session.startTime,
                endTime: session.endTime,
                attended: isAttended
              };
            });

            const grades = course.studentGrades && course.studentGrades[this.loggedUser.id!]
              ? [...course.studentGrades[this.loggedUser.id!]]
              : [];

            return {
              id: course.id!,
              name: course.name,
              teacher: course.teacher,
              schedule: course.schedule || '',
              grades: grades,
              sessions: sessions
            };
          });
      }
    });

    this.currentDate = new Date();
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionStatuses();
    }, 60000);

    setTimeout(() => {
      this.spinner.hide();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.courseSubscription) {
      this.courseSubscription.unsubscribe();
    }
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
  }

  openEnrollmentModal(): void {
    this.isEnrollmentModalOpen = true;
  }

  closeEnrollmentModal(): void {
    this.isEnrollmentModalOpen = false;
  }

  onEnrollmentChanged(updatedEnrollments: string[]): void {
    this.enrolledCourseIds = updatedEnrollments;

  }

  toggleView(courseName: string): void {
    this.selectedCourse = this.selectedCourse === courseName ? null : courseName;
  }

  calculateMeanGrade(grades: CourseGrade[]): number {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((total, grade) => total + grade.value, 0);
    return parseFloat((sum / grades.length).toFixed(1));
  }

  checkSessionStatuses(): void {
    this.currentDate = new Date();
    this.enrolledCourses.forEach(course => {
      course.sessions.forEach(session => {
        if (!session.attended && this.hasSessionEnded(session)) {
          console.log(`Marked absent for ${course.name}, session: ${session.id}`);
        }
      });
    });
  }

  canJoinSession(session: ClassSession): boolean {
    const sessionDate = new Date(session.date);

    if (
      sessionDate.getDate() !== this.currentDate.getDate() ||
      sessionDate.getMonth() !== this.currentDate.getMonth() ||
      sessionDate.getFullYear() !== this.currentDate.getFullYear()
    ) {
      return false;
    }

    const now = this.currentDate;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeMinutes = hours * 60 + minutes;

    const [startHours, startMinutes] = session.startTime.split(':').map(Number);
    const [endHours, endMinutes] = session.endTime.split(':').map(Number);

    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;

    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  }

  hasSessionEnded(session: ClassSession): boolean {
    const sessionDate = new Date(session.date);
    const currentDate = this.currentDate;

    if (sessionDate.getDate() !== currentDate.getDate() ||
        sessionDate.getMonth() !== currentDate.getMonth() ||
        sessionDate.getFullYear() !== currentDate.getFullYear()) {
      return false;
    }

    const now = this.currentDate;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeMinutes = hours * 60 + minutes;

    const [endHours, endMinutes] = session.endTime.split(':').map(Number);
    const endTimeMinutes = endHours * 60 + endMinutes;

    return currentTimeMinutes > endTimeMinutes;
  }

  getSessionStatus(session: ClassSession): string {
    const sessionDate = new Date(session.date);
    const todayMidnight = new Date(this.currentDate);
    todayMidnight.setHours(0, 0, 0, 0);

    if (session.attended) {
      return 'Present';
    }

    if (this.hasSessionEnded(session)) {
      return 'Absent';
    }

    if (sessionDate.getTime() < todayMidnight.getTime()) {
      return 'Absent';
    }

    if (this.canJoinSession(session)) {
      return 'Join Now';
    }

    return 'Upcoming';
  }

  getSessionStatusClass(session: ClassSession): string {
    const status = this.getSessionStatus(session);

    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Join Now':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  markAttendance(courseId: string, sessionId: string): void {
    this.spinner.show();

    this.store.dispatch(CourseActions.updateStudentAttendance({
      courseId,
      studentId: this.loggedUser.id!,
      sessionId,
      present: true
    }));

    const courseIndex = this.enrolledCourses.findIndex(course => course.id === courseId);
    if (courseIndex !== -1) {
      const sessionIndex = this.enrolledCourses[courseIndex].sessions.findIndex(
        session => session.id === sessionId
      );

      if (sessionIndex !== -1) {
        this.enrolledCourses[courseIndex].sessions[sessionIndex].attended = true;
      }
    }

    this.spinner.hide();
    NotificationComponent.show('success', 'Attendance marked successfully');
  }

  getAttendanceCount(course: EnrolledCourse): number {
    return course.sessions.filter(s => s.attended).length;
  }

  getAbsenceCount(course: EnrolledCourse): number {
    return course.sessions.filter(s =>
      !s.attended &&
      new Date(s.date) < this.currentDate &&
      this.getSessionStatus(s) === 'Absent'
    ).length;
  }

  getAttendanceRate(course: EnrolledCourse): string {
    const presentCount = this.getAttendanceCount(course);
    const totalCount = presentCount + this.getAbsenceCount(course);

    if (totalCount === 0) return '0';

    return (presentCount / totalCount * 100).toFixed(0);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  private updateEnrolledCourses(courses: Course[]): void {
    const commonGrades: CourseGrade[] = [
      { title: 'Midterm Exam', value: 9.5, date: '2025-02-15' },
      { title: 'Lab Report 1', value: 8.8, date: '2025-01-25' },
      { title: 'Lab Report 2', value: 7.5, date: '2025-03-10' }
    ];

    this.enrolledCourses = this.enrolledCourseIds
      .map(id => {
        const course = courses.find(c => c.id === id);

        if (!course) return null;

        return {
          id: course.id!,
          name: course.name,
          teacher: course.teacher,
          schedule: course.schedule || '',
          grades: [...commonGrades],
          sessions: (course.sessions || []).map(session => ({
            id: session.id,
            date: new Date(session.date),
            startTime: session.startTime,
            endTime: session.endTime,
            attended: false
          }))
        } as EnrolledCourse;
      })
      .filter(course => course !== null) as EnrolledCourse[];
  }
}
