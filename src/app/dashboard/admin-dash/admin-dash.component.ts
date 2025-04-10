import { Course, CourseSession, UserModel } from './../../core/user.model';
import * as CourseActions from '../../state/courses/course.actions';
import * as UserActions from '../../state/users/user.actions';
import { Store } from '@ngrx/store';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { selectAllCourses } from '../../state/courses/course.selector';
import { AsyncPipe } from '@angular/common';
import { SpinnerComponent } from '../../core/spinner/spinner.component';
import { SpinnerService } from '../../core/services/spinner.service';
import { ConfirmationDialogComponent } from "../../core/confirmation-dialog/confirmation-dialog.component";
import { selectAllUsers } from '../../state/users/user.selector';
import { v4 as uuidv4 } from 'uuid';
import { StudentDataComponent } from './student-data/student-data.component';

@Component({
  selector: 'app-admin-dash',
  standalone: true,
  imports: [FormsModule, AsyncPipe, SpinnerComponent, ConfirmationDialogComponent, StudentDataComponent],
  templateUrl: './admin-dash.component.html',
})
export class AdminDashComponent {
  @ViewChild('dialog') dialog!: ConfirmationDialogComponent;

  courseCount = 0;
  studentCount = 0;
  teacherCount = 0;

  newUser: UserModel = { fullName: '', role: '', email: '' };
  editingUserId: string | null = null;
  users$ = this.store.select(selectAllUsers);

  teachers: UserModel[] = [];

  newCourse: Course = {name: '', teacher: '', schedule: '', sessions: [], enrolledStudents: []};
  courses$ = this.store.select(selectAllCourses);
  editingCourseId: string | null = null;
  selectedCourseId: string | undefined = '';
  showStudentData = false;

  activeTab: 'grades' | 'attendance' = 'grades';

  showSessionModal = false;
  editingSession: CourseSession = {
    id: '',
    date: new Date(),
    startTime: '',
    endTime: '',
  };
  editingSessionIndex: number = -1;


  constructor(private store: Store, private spinner: SpinnerService) {}

  ngOnInit(): void {
    this.spinner.show();
    this.store.dispatch(CourseActions.loadCourses());
    this.store.dispatch(UserActions.loadUsers());
    this.courses$.subscribe(courses => {
      this.courseCount = courses.length;
    });
    this.users$.subscribe(users => {
      this.teachers = users.filter(user => user.role === 'Teacher');
      this.teacherCount = this.teachers.length;
      this.studentCount = users.filter(user => user.role === 'Student').length;
    });
    setTimeout(() => {
      this.spinner.hide();
    }, 300);
  }

  addCourse() {
    if (this.editingCourseId) {
      if (this.newCourse.teacherId) {
        const selectedTeacher = this.teachers.find(t => t.id === this.newCourse.teacherId);
        if (selectedTeacher) {
          this.newCourse.teacher = selectedTeacher.fullName;
        }
      }

      this.store.dispatch(CourseActions.updateCourse({
        course: { ...this.newCourse, id: this.editingCourseId }
      }));
    } else {
      if (this.newCourse.teacherId) {
        const selectedTeacher = this.teachers.find(t => t.id === this.newCourse.teacherId);
        if (selectedTeacher) {
          this.newCourse.teacher = selectedTeacher.fullName;
        }
      }

      const courseToAdd: Course = {
        ...this.newCourse,
        sessions: this.newCourse.sessions || [],
        enrolledStudents: []
      };
      this.store.dispatch(CourseActions.addCourse({
        course: courseToAdd
      }));
    }
    this.resetCourseForm();
  }

  editCourse(course: Course) {
    this.newCourse = { ...course };
    this.editingCourseId = course.id!;

    if (!this.newCourse.teacherId && this.newCourse.teacher) {
      const foundTeacher = this.teachers.find(t => t.fullName === this.newCourse.teacher);
      if (foundTeacher) {
        this.newCourse.teacherId = foundTeacher.id;
      }
    }
  }

  async deleteCourse(courseId: string): Promise<void> {
    const confirmed = await this.dialog.open('Do you really want to delete this course?');
    if (confirmed) {
      this.store.dispatch(CourseActions.deleteCourse({ courseId }))
    }
  }

  viewStudentData(course: Course): void {
    this.selectedCourseId = course.id || undefined;
    this.showStudentData = true;
  }

  closeStudentData(): void {
    this.selectedCourseId = undefined;
    this.showStudentData = false;
  }

  async deleteUser(userId: string): Promise<void> {
    const confirmed = await this.dialog.open('Do you really want to delete this user?');
    if (confirmed) {
      this.store.dispatch(UserActions.deleteUser({ userId }))
    }
  }

  editUser(user: UserModel) {
    if(user.role === "Admin") {
      return;
    }
    this.newUser = {
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
    this.editingUserId = user.id!;
  }

  updateUser() {
    this.store.dispatch(UserActions.updateUser({
      user: { ...this.newUser, id: this.editingUserId! }
    }));
    this.resetUserForm();
  }

  openAddSessionModal(course: Course): void {
    this.editingSession = {
      id: uuidv4(),
      date: new Date(),
      startTime: '10:00',
      endTime: '12:00'
    };
    this.editingSessionIndex = -1;
    this.showSessionModal = true;
  }

  editSession(course: Course, sessionIndex: number): void {
    this.editingSession = { ...course.sessions![sessionIndex] };
    this.editingSessionIndex = sessionIndex;
    this.showSessionModal = true;
  }

  saveSession(): void {
    if (!this.editingCourseId) return;

    const updatedCourse = { ...this.newCourse };

    if (this.editingSessionIndex === -1) {
      updatedCourse.sessions = [...updatedCourse.sessions!, this.editingSession];
    } else {
      updatedCourse.sessions = updatedCourse.sessions!.map((session, index) =>
        index === this.editingSessionIndex ? this.editingSession : session
      );
    }

    this.newCourse = updatedCourse;
    this.closeSessionModal();
  }

  async deleteSession(sessionIndex: number): Promise<void> {
    const confirmed = await this.dialog.open('Do you really want to delete this session?');
    if(confirmed) {
      const updatedCourse = { ...this.newCourse };
      updatedCourse.sessions = updatedCourse.sessions!.filter((_, index) => index !== sessionIndex);
      this.newCourse = updatedCourse;
    }
  }

  closeSessionModal(): void {
    this.showSessionModal = false;
  }

  resetCourseForm(): void {
    this.newCourse = {
      name: '',
      teacher: '',
      schedule: '',
      teacherId: '',
      sessions: [],
      enrolledStudents: []
    };
    this.editingCourseId = null;
  }

  resetUserForm(): void {
    this.newUser = { email: '', fullName: '', role: '' };
    this.editingUserId = null;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    return time;
  }
}
