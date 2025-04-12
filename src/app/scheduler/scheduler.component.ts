import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { SpinnerComponent } from '../core/spinner/spinner.component';
import { SpinnerService } from '../core/services/spinner.service';
import { ConfirmationDialogComponent } from '../core/confirmation-dialog/confirmation-dialog.component';
import { NotificationComponent } from '../core/notification/notification.component';

import { Course, CourseSession } from '../core/user.model';
import * as CourseActions from '../state/courses/course.actions';
import * as SchedulerActions from '../state/scheduler/scheduler.actions';
import { selectAllCourses } from '../state/courses/course.selector';
import { selectPendingCourses, selectSchedulerLoading, selectScheduleConflicts } from '../state/scheduler/scheduler.selectors';

import { SchedulerApiService } from '../core/services/scheduler-api.service';

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
}

interface SessionWithCourse extends CourseSession {
  courseName: string;
  courseId: string;
  isSelectedCourse: boolean;
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

  sessionConflicts: SessionConflict[] = [];

  constructor(
    private store: Store,
    private spinner: SpinnerService,
    private schedulerApiService: SchedulerApiService
  ) {
    this.courses$ = this.store.select(selectAllCourses);
    this.pendingCourses$ = this.store.select(selectPendingCourses);
    this.schedulerLoading$ = this.store.select(selectSchedulerLoading);
    this.conflicts$ = this.store.select(selectScheduleConflicts);
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.isAddSessionModalOpen) {
      this.closeAddSessionModal();
    }
  }

  ngOnInit() {
    this.loadData();
    this.generateCalendar();
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  loadData() {
    this.spinner.show();
    this.isLoading = true;

    this.store.dispatch(CourseActions.loadCourses());

    this.store.dispatch(SchedulerActions.loadPendingCourses());

    this.courses$.subscribe(courses => {
      this.allCourses = courses;
      this.generateCalendar();
      // console.log('All courses:', courses);
      const mathCourse = courses.find(c => c.name === 'Applied Mathematics');
      if (mathCourse) {
        // console.log('Math course details:', JSON.stringify(mathCourse));
        // console.log('Math course sessions:', mathCourse.sessions);
      }
    });

    this.pendingCourses$.subscribe(pendingCourses => {
      this.pendingCourses = pendingCourses;
      this.isLoading = false;
      this.spinner.hide();
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

  hasUnscheduledSessions(course: Course): boolean {
    return false;
  }

  selectCourse(course: Course) {
    // console.log('Selected course:', course);
    // console.log('Course ID:', course.id);
    this.selectedCourse = course;

    // Check all sessions and their isSelectedCourse property
    this.allCourses.forEach(c => {
      if (c.sessions) {
        c.sessions.forEach(s => {
          const isSelected = c.id === course.id;
          // console.log(
          //   `Course: ${c.name}, Session: ${s.startTime}, ` +
          //   `Course ID: ${c.id}, Selected ID: ${course.id}, ` +
          //   `IsSelected: ${isSelected}`
          // );
        });
      }
    });
  }

  generateCalendar() {
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

    this.generateCalendar();
  }

  nextMonth() {
    const newDate = new Date(this.currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentMonth = newDate;

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

      // if (course.name === 'Applied Mathematics') {
      //   console.log('Processing Applied Mathematics sessions for date:', date);
      //   console.log('Course ID:', course.id);
      //   console.log('Sessions:', course.sessions);
      // }

      course.sessions.forEach(session => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);

        // if (course.name === 'Applied Mathematics') {
        //   const sessionDate = new Date(session.date);
        //   console.log('Math session date:', sessionDate, 'Original:', session.date);
        //   console.log('Session object:', session);
        // }

        if (sessionDate.getTime() === dayStart.getTime()) {
          allSessions.push({
            ...session,
            courseName: course.name,
            courseId: course.id || '',
            isSelectedCourse: this.selectedCourse ? course.id === this.selectedCourse.id : false
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
    // console.log('Session clicked:', session);
    // console.log('Course name:', session.courseName);
    // console.log('Is from selected course:', session.isSelectedCourse);

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

  openAddSessionModal() {
    // Default to current date if none selected
    const defaultDate = new Date();
    defaultDate.setHours(0, 0, 0, 0);

    // Set default times (9 AM to 10:30 AM)
    const defaultStartTime = '09:00';
    const defaultEndTime = '10:30';

    this.editingSessionId = null;
    this.newSession = {
      id: uuidv4(),
      date: defaultDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime
    };

    this.isRecurring = false;
    this.recurrencePattern = 'weekly';
    this.recurrenceCount = 4;
    this.sessionConflicts = [];

    this.isAddSessionModalOpen = true;
  }

  closeAddSessionModal() {
    this.isAddSessionModalOpen = false;
  }

  editSession(session: CourseSession) {
    this.editingSessionId = session.id;
    this.newSession = {
      ...session,
      date: new Date(session.date)
    };
    this.isRecurring = false;
    this.sessionConflicts = [];

    this.checkForConflicts();
    this.isAddSessionModalOpen = true;
  }

  async deleteSession(session: CourseSession) {
    if (!this.selectedCourse) return;

    const confirmed = await this.dialog.open('Are you sure you want to delete this session?');

    if (confirmed) {
      const updatedCourse = { ...this.selectedCourse };
      updatedCourse.sessions = updatedCourse.sessions!.filter(s => s.id !== session.id);

      this.selectedCourse = updatedCourse;

      this.store.dispatch(CourseActions.updateCourse({ course: updatedCourse }));
      NotificationComponent.show('success', 'Session deleted successfully');
    }
  }

  checkForConflicts() {
    if (!this.newSession.date || !this.newSession.startTime || !this.newSession.endTime) {
      return;
    }

    this.sessionConflicts = [];

    const sessionDate = new Date(this.newSession.date);
    const sessionDay = sessionDate.getDate();
    const sessionMonth = sessionDate.getMonth();
    const sessionYear = sessionDate.getFullYear();

    const startMinutes = this.timeToMinutes(this.newSession.startTime);
    const endMinutes = this.timeToMinutes(this.newSession.endTime);

    this.allCourses.forEach(course => {
      if (!course.sessions) return;

      course.sessions.forEach(session => {
        if (this.editingSessionId && session.id === this.editingSessionId) {
          return;
        }

        const existingDate = new Date(session.date);

        if (existingDate.getDate() === sessionDay &&
          existingDate.getMonth() === sessionMonth &&
          existingDate.getFullYear() === sessionYear) {

          const existingStart = this.timeToMinutes(session.startTime);
          const existingEnd = this.timeToMinutes(session.endTime);

          if ((startMinutes >= existingStart && startMinutes < existingEnd) ||
            (endMinutes > existingStart && endMinutes <= existingEnd) ||
            (startMinutes <= existingStart && endMinutes >= existingEnd)) {

            this.sessionConflicts.push({
              id: session.id,
              date: existingDate,
              startTime: session.startTime,
              endTime: session.endTime,
              courseName: course.name
            });
          }
        }
      });
    });
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

  // Update the saveSession method in scheduler.component.ts
  saveSession() {
    if (!this.selectedCourse || !this.isSessionValid()) {
      return;
    }

    this.checkForConflicts();

    if (this.sessionConflicts.length > 0) {
      NotificationComponent.show('alert', 'Cannot save session due to scheduling conflicts');
      return;
    }

    // Create a deep copy of the selected course to modify
    const updatedCourse = JSON.parse(JSON.stringify(this.selectedCourse));

    // Ensure sessions array exists
    if (!updatedCourse.sessions) {
      updatedCourse.sessions = [];
    }

    if (this.isRecurring && !this.editingSessionId) {
      // Handle recurring sessions
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

      NotificationComponent.show('success', `Created ${recurringDates.length} recurring sessions`);
    } else {
      // Handle single session (add or edit)
      if (this.editingSessionId) {
        // Update existing session
        const index = updatedCourse.sessions.findIndex((s: { id: string | null; }) => s.id === this.editingSessionId);
        if (index !== -1) {
          updatedCourse.sessions[index] = {
            ...this.newSession
          };
        }
      } else {
        // Add new session
        updatedCourse.sessions.push({
          ...this.newSession
        });
      }

      NotificationComponent.show('success', 'Session saved successfully');
    }

    // Update the selected course with the new sessions
    this.selectedCourse = updatedCourse;

    // Important: Update the course in allCourses array as well to ensure calendar view is updated
    const courseIndex = this.allCourses.findIndex(c => c.id === updatedCourse.id);
    if (courseIndex !== -1) {
      this.allCourses[courseIndex] = updatedCourse;
    }

    // Close the modal
    this.closeAddSessionModal();

    // Regenerate calendar to show the new sessions
    this.generateCalendar();
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

    //this.store.dispatch(CourseActions.updateCourse({ course: this.selectedCourse }));

    this.store.dispatch(SchedulerActions.submitSchedule({
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
    this.pollingInterval = setInterval(() => {
      if (this.pollingEnabled) {
        this.checkForNewPendingCourses();
      }
    }, 60000);
  }


  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }


  checkForNewPendingCourses() {
    this.lastPolled = new Date();

    this.store.dispatch(SchedulerActions.loadPendingCourses());
  }


  togglePolling() {
    this.pollingEnabled = !this.pollingEnabled;
    if (this.pollingEnabled) {
      this.checkForNewPendingCourses();
    }
  }
}
