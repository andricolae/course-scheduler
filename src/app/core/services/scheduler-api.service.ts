// Update the SchedulerApiService to handle authentication

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, CourseSession } from '../../core/user.model';

@Injectable({
  providedIn: 'root'
})
export class SchedulerApiService {
  private apiUrl = 'https://school-api-server.vercel.app/api';

  constructor(private http: HttpClient) { }

  getPendingCourses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-pending`);
  }

  checkScheduleConflicts(sessions: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-conflicts`, { sessions });
  }

  /**
   * Get the auth headers for API requests
   */
  private getAuthHeaders(): HttpHeaders {
    // Get the auth token from localStorage
    const userData = localStorage.getItem('userData');
    let token = '';

    if (userData) {
      const user = JSON.parse(userData);
      token = user._token || '';
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Get courses pending scheduling
   */
  getPendingSchedules(): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Course[]>(`${this.apiUrl}/pending-schedule`, { headers });
  }

  /**
   * Submit a course schedule
   * @param courseId The ID of the course being scheduled
   * @param sessions The array of course sessions
   */
  submitSchedule(courseId: string, sessions: CourseSession[]): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/submit-schedule`, {
      courseId,
      sessions
    }, { headers });
  }

  /**
   * Check for scheduling conflicts with existing sessions
   * @param sessions The sessions to check for conflicts
   */
  checkConflicts(sessions: CourseSession[]): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/check-conflicts`, { sessions }, { headers });
  }

  /**
   * Get all scheduled sessions across all courses
   * This is useful for conflict checking and calendar views
   */
  getAllScheduledSessions(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/scheduled-sessions`, { headers });
  }

  /**
   * Get detailed information about a course, including its schedule
   * @param courseId The ID of the course to fetch
   */
  getCourseSchedule(courseId: string): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http.get<Course>(`${this.apiUrl}/courses/${courseId}/schedule`, { headers });
  }
}
