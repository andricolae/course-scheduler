// src/app/scheduler/scheduler.component.ts
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Course, CourseSession } from '../core/user.model';
import * as CourseActions from '../state/courses/course.actions';
import { selectAllCourses } from '../state/courses/course.selector';
import { SpinnerComponent } from '../core/spinner/spinner.component';
import { SpinnerService } from '../core/services/spinner.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { NotificationComponent } from '../core/notification/notification.component';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SpinnerComponent
  ],
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.css']
})
export class SchedulerComponent implements OnInit {
  courses$: Observable<Course[]>;
  pendingCourses: Course[] = [];
  selectedCourse: Course | null = null;
  isAddSessionModalOpen: boolean = false;

  newSession: CourseSession = {
    id: '',
    date: new Date(),
    startTime: '',
    endTime: ''
  };

  constructor(
    private store: Store,
    private spinner: SpinnerService
  ) {
    this.courses$ = this.store.select(selectAllCourses);
  }

  ngOnInit() {
    this.spinner.show();
    this.store.dispatch(CourseActions.loadCourses());

    this.courses$.subscribe(courses => {
      this.pendingCourses = courses.filter(course =>
        !course.sessions || course.sessions.length === 0
      );
      this.spinner.hide();
    });
  }

  selectCourse(course: Course) {
    this.selectedCourse = course;
  }

  openAddSessionModal() {
    this.newSession = {
      id: uuidv4(),
      date: new Date(),
      startTime: '09:00',
      endTime: '10:30'
    };
    this.isAddSessionModalOpen = true;
  }

  closeAddSessionModal() {
    this.isAddSessionModalOpen = false;
  }

  saveSession() {
    if (!this.selectedCourse || !this.selectedCourse.id) return;

    const updatedCourse = { ...this.selectedCourse };

    if (!updatedCourse.sessions) {
      updatedCourse.sessions = [];
    }

    updatedCourse.sessions.push(this.newSession);

    this.store.dispatch(CourseActions.updateCourse({ course: updatedCourse }));
    this.closeAddSessionModal();
    NotificationComponent.show('success', 'Session added successfully');
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
