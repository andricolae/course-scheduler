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

  private getAuthHeaders(): HttpHeaders {
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

  getPendingSchedules(): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Course[]>(`${this.apiUrl}/pending-schedule`, { headers });
  }

  submitSchedule(courseId: string, sessions: CourseSession[]): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/submit-schedule`, {
      courseId,
      sessions
    }, { headers });
  }

  checkConflicts(sessions: CourseSession[]): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/check-conflicts`, { sessions }, { headers });
  }

  getAllScheduledSessions(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/scheduled-sessions`, { headers });
  }

  getCourseSchedule(courseId: string): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http.get<Course>(`${this.apiUrl}/courses/${courseId}/schedule`, { headers });
  }
}
