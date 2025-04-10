import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course } from '../user.model';

@Injectable({
  providedIn: 'root'
})
export class SchedulerApiService {
  private apiUrl = 'https://school-api-server.vercel.app/api';

  constructor(private http: HttpClient) { }

  getPendingSchedules(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/pending-schedule`);
  }

  submitSchedule(courseId: string, sessions: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit-schedule`, {
      courseId,
      sessions
    });
  }
}
