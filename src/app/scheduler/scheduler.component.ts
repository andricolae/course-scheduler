import { ChangeDetectorRef, Component, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { SpinnerComponent } from '../core/spinner/spinner.component';
import { SpinnerService } from '../core/services/spinner.service';
import { ConfirmationDialogComponent } from '../core/confirmation-dialog/confirmation-dialog.component';
import { NotificationComponent } from '../core/notification/notification.component';
import * as LogActions from '../state/logs/log.actions';
import { LogCategory } from '../core/log.model';

import { Course, CourseSession } from '../core/user.model';
import * as CourseActions from '../state/courses/course.actions';
import * as AppConfigActions from '../state/app-config/app-config.actions';
import * as SchedulerActions from '../state/scheduler/scheduler.actions';
import { selectAllCourses } from '../state/courses/course.selector';
import { selectPendingCourses, selectSchedulerLoading, selectScheduleConflicts } from '../state/scheduler/scheduler.selectors';

import { SchedulerApiService } from '../core/services/scheduler-api.service';
import { selectAllowTeacherScheduleOverlap } from '../state/app-config/app-config.selectors';

interface CalendarDay {
  date: Date;
  dayNumber: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface SessionConflict {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  courseName: string;
  teacherId?: string;
  teacher: string;
}

interface SessionWithCourse extends CourseSession {
  courseName: string;
  courseId: string;
  isSelectedCourse: boolean;
  teacher: string;
  teacherId?: string;
}

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SpinnerComponent,
    ConfirmationDialogComponent
  ],
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.css']
})
export class SchedulerComponent implements OnInit {
  @ViewChild('dialog') dialog!: ConfirmationDialogComponent;

  courses$: Observable<Course[]>;
  pendingCourses$: Observable<Course[]>;
  schedulerLoading$: Observable<boolean>;
  conflicts$: Observable<any[]>;
  allowTeacherScheduleOverlap$: Observable<boolean>;
  allowTeacherScheduleOverlap = false;

  allCourses: Course[] = [];
  pendingCourses: Course[] = [];
  selectedCourse: Course | null = null;

  isLoading = false;
  isAddSessionModalOpen = false;
  editingSessionId: string | null = null;

  currentMonth = new Date();
  calendarDays: CalendarDay[] = [];

  newSession: CourseSession = {
    id: '',
    date: new Date(),
    startTime: '',
    endTime: ''
  };

  isRecurring = false;
  recurrencePattern: 'weekly' | 'biweekly' | 'monthly' = 'weekly';
  recurrenceCount = 4;
  newSessionDateString: string = '';
  sessionConflicts: SessionConflict[] = [];
  private store = inject(Store, { optional: true });

  constructor(
    private spinner: SpinnerService,
    private schedulerApiService: SchedulerApiService,
    private cdRef: ChangeDetectorRef
  ) {
    this.courses$ = this.store!.select(selectAllCourses);
    this.pendingCourses$ = this.store!.select(selectPendingCourses);
    this.schedulerLoading$ = this.store!.select(selectSchedulerLoading);
    this.conflicts$ = this.store!.select(selectScheduleConflicts);
    this.allowTeacherScheduleOverlap$ = this.store!.select(selectAllowTeacherScheduleOverlap);
  }

  private logSchedulerAction(action: string, details?: any): void {
    this.store!.dispatch(LogActions.addLog({
      log: {
        timestamp: Date.now(),
        category: LogCategory.SCHEDULER,
        action,
        details
      }
    }));
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.isAddSessionModalOpen) {
      this.closeAddSessionModal();
    }
  }

  ngOnInit() {
    this.logSchedulerAction('SCHEDULER_INITIALIZED');

    this.loadData();
    this.generateCalendar();
    this.startPolling();

    this.store!.dispatch(AppConfigActions.loadAppConfig());

    this.allowTeacherScheduleOverlap$.subscribe(allowOverlap => {
      this.allowTeacherScheduleOverlap = allowOverlap;
      this.logSchedulerAction('SCHEDULE_OVERLAP_SETTING_CHANGED', { allowOverlap });

      if (this.isAddSessionModalOpen) {
        this.checkForConflicts();
      }
    });
  }

  ngOnDestroy() {
    this.stopPolling();
    this.logSchedulerAction('SCHEDULER_DESTROYED');
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  loadData() {
    this.spinner.show();
    this.isLoading = true;

    this.logSchedulerAction('LOAD_COURSES');
    this.store!.dispatch(CourseActions.loadCourses());

    this.logSchedulerAction('LOAD_PENDING_COURSES');
    this.store!.dispatch(SchedulerActions.loadPendingCourses());

    this.courses$.subscribe(courses => {
      this.allCourses = courses;
      this.generateCalendar();
      this.logSchedulerAction('COURSES_LOADED', { count: courses.length });
    });

    this.pendingCourses$.subscribe(pendingCourses => {
      this.pendingCourses = pendingCourses;
      this.isLoading = false;
      this.spinner.hide();
      this.logSchedulerAction('PENDING_COURSES_LOADED', { count: pendingCourses.length });
    });

    this.schedulerLoading$.subscribe(loading => {
      this.isLoading = loading;
      if (loading) {
        this.spinner.show();
      } else {
        this.spinner.hide();
      }
    });
  }

  toggleScheduleOverlapSetting() {
    this.store!.dispatch(AppConfigActions.toggleScheduleOverlapSetting({
      allowOverlap: !this.allowTeacherScheduleOverlap
    }));
  }

  hasUnscheduledSessions(course: Course): boolean {
    return false;
  }

  selectCourse(course: Course) {
    this.selectedCourse = course;
    this.logSchedulerAction('COURSE_SELECTED', { courseId: course.id, courseName: course.name });
  }

  generateCalendar() {
    const newCalendarDays: CalendarDay[] = [];
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = new Date(firstDay);
    startDay.setDate(firstDay.getDate() - firstDay.getDay());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.calendarDays = [];

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDay);
      currentDate.setDate(startDay.getDate() + i);
      const isCurrentMonth = currentDate.getMonth() === month;

      this.calendarDays.push({
        date: new Date(currentDate),
        dayNumber: currentDate.getDate().toString(),
        isCurrentMonth,
        isToday: currentDate.getTime() === today.getTime()
      });
    }
  }

  prevMonth() {
    const newDate = new Date(this.currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentMonth = newDate;
    this.logSchedulerAction('CALENDAR_PREV_MONTH', {
      month: newDate.getMonth() + 1,
      year: newDate.getFullYear()
    });
    this.generateCalendar();
  }

  nextMonth() {
    const newDate = new Date(this.currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentMonth = newDate;
    this.logSchedulerAction('CALENDAR_NEXT_MONTH', {
      month: newDate.getMonth() + 1,
      year: newDate.getFullYear()
    });
    this.generateCalendar();
  }

  getSessionsForDay(date: Date): SessionWithCourse[] {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const allSessions: SessionWithCourse[] = [];

    this.allCourses.forEach(course => {
      if (!course.sessions) return;

      course.sessions.forEach(session => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);

        if (sessionDate.getTime() === dayStart.getTime()) {
          allSessions.push({
            ...session,
            courseName: course.name,
            courseId: course.id || '',
            isSelectedCourse: this.selectedCourse ? course.id === this.selectedCourse.id : false,
            teacher: course.teacher,
            teacherId: course.teacherId
          });
        }
      });
    });

    return allSessions.sort((a, b) => {
      const timeA = this.timeToMinutes(a.startTime);
      const timeB = this.timeToMinutes(b.startTime);
      return timeA - timeB;
    });
  }

  handleSessionClick(session: SessionWithCourse) {
    this.logSchedulerAction('SESSION_CLICKED', {
      sessionId: session.id,
      courseId: session.courseId,
      courseName: session.courseName,
      date: new Date(session.date).toISOString().split('T')[0],
      time: `${session.startTime}-${session.endTime}`
    });

    if (session.isSelectedCourse && this.selectedCourse) {
      this.editSession(session);
      return;
    }

    const courseName = session.courseName || 'Unknown Course';
    const message = `Can't access ${courseName} course's session because it is not selected`;
    NotificationComponent.show('alert', message, 5000);
  }

  sortedSessions() {
    if (!this.selectedCourse || !this.selectedCourse.sessions) {
      return [];
    }
    return [...this.selectedCourse.sessions].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }

  isConflictWithSameTeacher(conflict: SessionConflict): boolean {
    if (!this.selectedCourse || !conflict) return false;

    if (this.selectedCourse.teacherId && conflict.teacherId) {
      return this.selectedCourse.teacherId === conflict.teacherId;
    }
    return this.selectedCourse.teacher === conflict.teacher;
  }

  openAddSessionModal() {
    const defaultDate = new Date();
    defaultDate.setHours(0, 0, 0, 0);

    const defaultStartTime = '09:00';
    const defaultEndTime = '10:30';

    this.editingSessionId = null;
    this.newSession = {
      id: uuidv4(),
      date: defaultDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime
    };

    this.newSessionDateString = this.formatDateForInput(defaultDate);

    this.isRecurring = false;
    this.recurrencePattern = 'weekly';
    this.recurrenceCount = 4;
    this.sessionConflicts = [];

    this.logSchedulerAction('ADD_SESSION_MODAL_OPENED', {
      courseId: this.selectedCourse?.id,
      courseName: this.selectedCourse?.name
    });

    this.isAddSessionModalOpen = true;
  }

  editSession(session: CourseSession) {
    this.editingSessionId = session.id;
    this.newSession = {
      ...session,
      date: new Date(session.date)
    };

    this.newSessionDateString = this.formatDateForInput(new Date(session.date));

    this.isRecurring = false;
    this.sessionConflicts = [];

    this.logSchedulerAction('EDIT_SESSION_STARTED', {
      sessionId: session.id,
      courseId: this.selectedCourse?.id,
      date: new Date(session.date).toISOString().split('T')[0],
      time: `${session.startTime}-${session.endTime}`
    });

    this.checkForConflicts();
    this.isAddSessionModalOpen = true;
    this.generateCalendar();
  }

  async deleteSession(session: CourseSession) {
    if (!this.selectedCourse) return;

    this.logSchedulerAction('DELETE_SESSION_ATTEMPT', {
      sessionId: session.id,
      courseId: this.selectedCourse.id,
      date: new Date(session.date).toISOString().split('T')[0],
      time: `${session.startTime}-${session.endTime}`
    });

    const confirmed = await this.dialog.open('Are you sure you want to delete this session?');

    if (confirmed) {
      const updatedCourse = { ...this.selectedCourse };
      updatedCourse.sessions = updatedCourse.sessions!.filter(s => s.id !== session.id);

      this.selectedCourse = updatedCourse;

      this.logSchedulerAction('DELETE_SESSION_CONFIRMED', {
        sessionId: session.id,
        courseId: this.selectedCourse.id
      });

      NotificationComponent.show('success', 'Session deleted successfully');
    } else {
      this.logSchedulerAction('DELETE_SESSION_CANCELLED', {
        sessionId: session.id,
        courseId: this.selectedCourse.id
      });
    }
  }

  checkForConflicts() {
    if (!this.selectedCourse || !this.newSession.date || !this.newSession.startTime || !this.newSession.endTime) {
      return;
    }

    this.sessionConflicts = [];
    const sessionDate = new Date(this.newSession.date);
    sessionDate.setHours(0, 0, 0, 0);
    const sessionDay = sessionDate.getDate();
    const sessionMonth = sessionDate.getMonth();
    const sessionYear = sessionDate.getFullYear();
    const startMinutes = this.timeToMinutes(this.newSession.startTime);
    const endMinutes = this.timeToMinutes(this.newSession.endTime);
    const currentTeacherId = this.selectedCourse.teacherId;
    const currentTeacher = this.selectedCourse.teacher;

    this.allCourses.forEach(course => {
      if (!course.sessions) return;

      course.sessions.forEach(session => {
        if (this.editingSessionId && session.id === this.editingSessionId) {
          return;
        }

        const existingDate = new Date(session.date);
        existingDate.setHours(0, 0, 0, 0);

        const existingDay = existingDate.getDate();
        const existingMonth = existingDate.getMonth();
        const existingYear = existingDate.getFullYear();

        if (existingDay === sessionDay &&
          existingMonth === sessionMonth &&
          existingYear === sessionYear) {

          const existingStart = this.timeToMinutes(session.startTime);
          const existingEnd = this.timeToMinutes(session.endTime);

          const hasTimeOverlap = (startMinutes >= existingStart && startMinutes < existingEnd) ||
            (endMinutes > existingStart && endMinutes <= existingEnd) ||
            (startMinutes <= existingStart && endMinutes >= existingEnd);

          if (hasTimeOverlap) {
            const isSameTeacher = currentTeacherId && course.teacherId ?
              currentTeacherId === course.teacherId :
              currentTeacher === course.teacher;

            if (isSameTeacher && !this.allowTeacherScheduleOverlap) {
              this.sessionConflicts.push({
                id: session.id || '',
                date: existingDate,
                startTime: session.startTime,
                endTime: session.endTime,
                courseName: course.name,
                teacher: course.teacher,
                teacherId: course.teacherId
              });
            }
          }
        }
      });
    });

    if (this.sessionConflicts.length > 0) {
      this.logSchedulerAction('SCHEDULING_CONFLICTS_DETECTED', {
        courseId: this.selectedCourse?.id,
        date: sessionDate.toISOString().split('T')[0],
        time: `${this.newSession.startTime}-${this.newSession.endTime}`,
        conflictsCount: this.sessionConflicts.length,
        conflicts: this.sessionConflicts.map(c => ({
          id: c.id,
          courseName: c.courseName,
          time: `${c.startTime}-${c.endTime}`,
          teacher: c.teacher,
          date: new Date(c.date).toLocaleDateString()
        })),
        allowTeacherOverlap: this.allowTeacherScheduleOverlap
      });
    }
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  isSessionValid(): boolean {
    const { date, startTime, endTime } = this.newSession;

    if (!date || !startTime || !endTime) {
      return false;
    }

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      return false;
    }
    return true;
  }

  updateSessionPreview() {
    if (this.newSessionDateString) {
      const dateParts = this.newSessionDateString.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);

        const newDate = new Date(year, month, day);
        newDate.setHours(0, 0, 0, 0);

        this.newSession.date = newDate;

        console.log('Date converted from:', this.newSessionDateString, 'to:', this.newSession.date.toISOString());
      }
    }

    this.checkForConflicts();
    this.generateCalendar();
    this.cdRef.detectChanges();
  }

  saveSession() {
    if (!this.selectedCourse || !this.isSessionValid()) {
      return;
    }

    this.checkForConflicts();

    if (this.sessionConflicts.length > 0 && !this.allowTeacherScheduleOverlap) {
      this.logSchedulerAction('SESSION_SAVE_FAILED_CONFLICTS', {
        courseId: this.selectedCourse.id,
        sessionId: this.editingSessionId || this.newSession.id,
        conflictsCount: this.sessionConflicts.length,
        allowTeacherOverlap: this.allowTeacherScheduleOverlap
      });

      NotificationComponent.show('alert', 'Cannot save session due to scheduling conflicts');
      return;
    }

    this.spinner.show();
    const updatedCourse = JSON.parse(JSON.stringify(this.selectedCourse));

    if (!updatedCourse.sessions) {
      updatedCourse.sessions = [];
    }

    if (this.isRecurring && !this.editingSessionId) {
      const recurringDates = this.generateRecurringDates(
        new Date(this.newSession.date),
        this.recurrencePattern,
        this.recurrenceCount
      );

      recurringDates.forEach((date, index) => {
        const newSessionCopy = {
          ...this.newSession,
          id: index === 0 ? this.newSession.id : uuidv4(),
          date: date
        };

        updatedCourse.sessions.push(newSessionCopy);
      });

      this.logSchedulerAction('RECURRING_SESSIONS_CREATED', {
        courseId: this.selectedCourse.id,
        pattern: this.recurrencePattern,
        count: recurringDates.length,
        startDate: recurringDates[0].toISOString().split('T')[0]
      });

      NotificationComponent.show('success', `Created ${recurringDates.length} recurring sessions`);
    } else {
      if (this.editingSessionId) {
        const index = updatedCourse.sessions.findIndex((s: { id: string | null; }) => s.id === this.editingSessionId);
        if (index !== -1) {
          updatedCourse.sessions[index] = {
            ...this.newSession
          };

          this.logSchedulerAction('SESSION_UPDATED', {
            courseId: this.selectedCourse.id,
            sessionId: this.editingSessionId,
            date: new Date(this.newSession.date).toISOString().split('T')[0],
            time: `${this.newSession.startTime}-${this.newSession.endTime}`
          });
        }
      } else {
        updatedCourse.sessions.push({
          ...this.newSession
        });
        this.logSchedulerAction('SESSION_ADDED', {
          courseId: this.selectedCourse.id,
          sessionId: this.newSession.id,
          date: new Date(this.newSession.date).toISOString().split('T')[0],
          time: `${this.newSession.startTime}-${this.newSession.endTime}`
        });
      }

      NotificationComponent.show('success', 'Session saved successfully');
    }

    this.selectedCourse = updatedCourse;

    this.allCourses = this.allCourses.map(course =>
      course.id === updatedCourse.id ? updatedCourse : course
    );

    this.generateCalendar();
    this.spinner.hide();
    this.closeAddSessionModal();
    this.cdRef.detectChanges();
  }

  closeAddSessionModal() {
    this.logSchedulerAction('SESSION_MODAL_CLOSED');
    this.isAddSessionModalOpen = false;
    this.generateCalendar();
    this.cdRef.detectChanges();
  }

  generateRecurringDates(startDate: Date, pattern: string, count: number): Date[] {
    const dates: Date[] = [new Date(startDate)];

    for (let i = 1; i < count; i++) {
      const nextDate = new Date(startDate);

      switch (pattern) {
        case 'weekly':
          nextDate.setDate(startDate.getDate() + (7 * i));
          break;
        case 'biweekly':
          nextDate.setDate(startDate.getDate() + (14 * i));
          break;
        case 'monthly':
          nextDate.setMonth(startDate.getMonth() + i);
          break;
      }
      dates.push(nextDate);
    }
    return dates;
  }

  saveCourseSchedule() {
    if (!this.selectedCourse || !this.selectedCourse.id || !this.selectedCourse.sessions) {
      NotificationComponent.show('alert', 'No course or sessions to save');
      return;
    }

    this.spinner.show();

    this.logSchedulerAction('SAVE_COURSE_SCHEDULE', {
      courseId: this.selectedCourse.id,
      courseName: this.selectedCourse.name,
      sessionsCount: this.selectedCourse.sessions.length
    });

    this.store!.dispatch(SchedulerActions.submitSchedule({
      courseId: this.selectedCourse.id,
      sessions: this.selectedCourse.sessions
    }));

    this.selectedCourse = null;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateForStorage(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private pollingInterval: any;
  pollingEnabled = true;
  lastPolled: Date | null = null;

  startPolling() {
    this.logSchedulerAction('POLLING_STARTED', { interval: '60 seconds' });

    this.pollingInterval = setInterval(() => {
      if (this.pollingEnabled) {
        this.checkForNewPendingCourses();
      }
    }, 60000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.logSchedulerAction('POLLING_STOPPED');
    }
  }

  checkForNewPendingCourses() {
    this.lastPolled = new Date();
    this.logSchedulerAction('POLLING_CHECK', { timestamp: this.lastPolled.toISOString() });
    this.store!.dispatch(SchedulerActions.loadPendingCourses());
  }

  togglePolling() {
    this.pollingEnabled = !this.pollingEnabled;
    this.logSchedulerAction('POLLING_TOGGLED', { enabled: this.pollingEnabled });
    if (this.pollingEnabled) {
      this.checkForNewPendingCourses();
    }
  }
}
