import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { Course } from '../../../core/user.model';
import * as CourseSelectors from '../../../state/courses/course.selector';
import * as CourseActions from '../../../state/courses/course.actions';
import { SpinnerComponent } from '../../../core/spinner/spinner.component';
import { SpinnerService } from '../../../core/services/spinner.service';

interface AppState {
  courses: {
    courses: Course[];
    loading: boolean;
    error: string | null;
  };
}

@Component({
  selector: 'app-course-enrollment',
  imports: [CommonModule, SpinnerComponent, FormsModule],
  templateUrl: './course-enrollment.component.html',
  styleUrl: './course-enrollment.component.css'
})
export class CourseEnrollmentComponent implements OnInit, OnDestroy {
  @Input() studentId!: string;
  @Input() enrolledCourseIds: string[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() enrollmentChanged = new EventEmitter<string[]>();

  availableCourses$: Observable<Course[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  isLoading = false;

  searchTerm: string = '';
  selectedTeacher: string = '';
  teachersList: string[] = [];
  filteredCourses: Course[] = [];
  allCourses: Course[] = [];

  private coursesSubscription?: Subscription;

  constructor(
    private store: Store<AppState>,
    private spinner: SpinnerService
  ) {
    this.availableCourses$ = this.store.select(CourseSelectors.selectAvailableCourses);
    this.loading$ = this.store.select(CourseSelectors.selectCoursesLoading);
    this.error$ = this.store.select(CourseSelectors.selectCoursesError);
  }

  ngOnInit() {
    this.store.dispatch(CourseActions.loadCourses());

    this.coursesSubscription = this.availableCourses$.subscribe(courses => {
      this.allCourses = courses;

      this.teachersList = Array.from(new Set(courses.map(course => course.teacher)))
        .filter(teacher => teacher)
        .sort();

      this.filterCourses();
    });
  }

  ngOnDestroy() {
    if (this.coursesSubscription) {
      this.coursesSubscription.unsubscribe();
    }
  }

  isEnrolled(courseId: string): boolean {
    return this.enrolledCourseIds.includes(courseId);
  }

  toggleEnrollment(course: Course): void {
    if (!this.studentId || !course.id) return;

    this.spinner.show();
    this.isLoading = true;

    setTimeout(() => {
      let updatedEnrollments: string[];

      if (this.isEnrolled(course.id!)) {
        this.store.dispatch(CourseActions.unenrollStudent({
          courseId: course.id!,
          studentId: this.studentId
        }));
        updatedEnrollments = this.enrolledCourseIds.filter(id => id !== course.id);
      } else {
        this.store.dispatch(CourseActions.enrollStudent({
          courseId: course.id!,
          studentId: this.studentId
        }));
        updatedEnrollments = [...this.enrolledCourseIds, course.id!];
      }

      this.spinner.hide();
      this.isLoading = false;

      this.enrollmentChanged.emit(updatedEnrollments);
    }, 500);
  }

  close() {
    this.closeModal.emit();
  }

  formatSessionDates(course: Course): string {
    if (!course.sessions || course.sessions.length === 0) {
      return 'No sessions scheduled';
    }

    const sortedSessions = [...course.sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const displaySessions = sortedSessions.slice(0, 3);

    return displaySessions.map(session => {
      const date = new Date(session.date);
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${session.startTime}-${session.endTime}`;
    }).join(', ') + (sortedSessions.length > 3 ? ' + more' : '');
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterCourses();
  }

  filterCourses(): void {
    this.filteredCourses = this.allCourses.filter(course => {
      const teacherMatch = !this.selectedTeacher || course.teacher === this.selectedTeacher;

      const searchMatch = !this.searchTerm ||
        course.name.toLowerCase().includes(this.searchTerm.toLowerCase());

      return teacherMatch && searchMatch;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedTeacher = '';
    this.filterCourses();
  }

  getEnrollmentStatus(course: Course): { text: string; color: string } {
    return { text: 'Open', color: 'green' };
  }
}
