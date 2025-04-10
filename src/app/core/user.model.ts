export class User {
  constructor(
    public email: string,
    public id: string,
    private _token: string,
    private _tokenExpirationDate: Date,
    public role: string
  ) {}

  get token() {
    if (!this._tokenExpirationDate || new Date() > this._tokenExpirationDate) {
      return null;
    }
    return this._token;
  }
}

export interface Course {
  id?: string;
  name: string;
  teacher: string;
  teacherId?: string;
  schedule?: string;
  sessions?: CourseSession[];
  enrolledStudents?: string[];
  studentGrades?: {
    [studentId: string]: {
      id: string;
      title: string;
      value: number;
      date: string;
    }[]
  };
  studentAttendance?: {
    [studentId: string]: {
      [sessionId: string]: boolean
    }
  };
}

export interface CourseSession {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
}

export interface UserModel {
  id?: string;
  email: string;
  fullName: string;
  role: string;
}
