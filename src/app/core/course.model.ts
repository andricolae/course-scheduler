export interface CourseSchedule {
  id: string;
  courseId: string;
  courseName: string;
  teacher: string;
  status: 'pending' | 'scheduled';
  sessions: CourseSession[];
  lastUpdated: Date;
}

export interface CourseSession {
  id?: string;
  courseId: string;
  date: Date;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  recurring?: boolean;
  recurrencePattern?: 'weekly' | 'biweekly' | 'monthly';
}
