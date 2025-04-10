import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, updateDoc, getDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { from, map, Observable, switchMap } from 'rxjs';
import { Course } from '../user.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private coursesCollection;

  constructor(private firestore: Firestore) {
    this.coursesCollection = collection(this.firestore, 'courses');
  }


getCourses(): Observable<Course[]> {
  return collectionData(this.coursesCollection, { idField: 'id' }).pipe(
    map(courses => {
      return courses.map(course => {
        if (course['sessions']) {
          course['sessions'] = course['sessions'].map((session: any) => {
            if (session.date && typeof session.date.toDate === 'function') {
              return {
                ...session,
                date: session.date.toDate()
              };
            }
            return session;
          });
        } else {
          course['sessions'] = [];
        }

        if (!course['studentGrades']) {
          course['studentGrades'] = {};
        }

        if (!course['studentAttendance']) {
          course['studentAttendance'] = {};
        }

        return course as Course;
      });
    })
  ) as Observable<Course[]>;
}

  getCourse(id: string): Observable<Course | undefined> {
    const courseDoc = doc(this.firestore, `courses/${id}`);
    return from(getDoc(courseDoc)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data['sessions']) {
            data['sessions'] = data['sessions'].map((session: any) => {
              if (session.date && typeof session.date.toDate === 'function') {
                return {
                  ...session,
                  date: session.date.toDate()
                };
              }
              return session;
            });
          }
          return { ...data, id: docSnap.id } as Course;
        }
        return undefined;
      })
    );
  }

  addCourse(course: Omit<Course, 'id'>): Observable<string> {
    const courseToAdd = {
      ...course,
      sessions: course.sessions || [],
      enrolledStudents: course.enrolledStudents || []
    };
    return from(addDoc(this.coursesCollection, courseToAdd).then(ref => ref.id));
  }

  deleteCourse(courseId: string): Observable<void> {
    const courseDoc = doc(this.firestore, `courses/${courseId}`);
    return from(deleteDoc(courseDoc));
  }

  updateCourse(course: Course): Observable<void> {
    const courseDoc = doc(this.firestore, `courses/${course.id}`);
    const { id, ...courseWithoutId } = course;
    return from(updateDoc(courseDoc, courseWithoutId));
  }

  enrollStudent(courseId: string, studentId: string): Observable<void> {
    const courseDoc = doc(this.firestore, `courses/${courseId}`);
    return from(
      updateDoc(courseDoc, {
        enrolledStudents: arrayUnion(studentId)
      })
    );
  }

  unenrollStudent(courseId: string, studentId: string): Observable<void> {
    const courseDoc = doc(this.firestore, `courses/${courseId}`);
    return from(
      updateDoc(courseDoc, {
        enrolledStudents: arrayRemove(studentId)
      })
    );
  }

  addStudentGrade(courseId: string, studentId: string, grade: any): Observable<string> {
    const courseDoc = doc(this.firestore, `courses/${courseId}`);
    const gradeId = uuidv4();

    return from(getDoc(courseDoc)).pipe(
      switchMap(docSnap => {
        if (docSnap.exists()) {
          const courseData = docSnap.data();

          let studentGrades = courseData['studentGrades'] || {};

          if (!studentGrades[studentId]) {
            studentGrades[studentId] = [];
          }

          const newGrade = {
            id: gradeId,
            title: grade.title,
            value: grade.value,
            date: grade.date
          };

          studentGrades[studentId].push(newGrade);

          return from(updateDoc(courseDoc, { studentGrades })).pipe(
            map(() => gradeId)
          );
        }
        throw new Error('Course not found');
      })
    );
  }

  updateStudentAttendance(courseId: string, studentId: string, sessionId: string, present: boolean): Observable<void> {
    const courseDoc = doc(this.firestore, `courses/${courseId}`);

    return from(getDoc(courseDoc)).pipe(
      switchMap(docSnap => {
        if (docSnap.exists()) {
          const courseData = docSnap.data();

          let studentAttendance = courseData['studentAttendance'] || {};

          if (!studentAttendance[studentId]) {
            studentAttendance[studentId] = {};
          }

          studentAttendance[studentId][sessionId] = present;

          return from(updateDoc(courseDoc, { studentAttendance }));
        }
        throw new Error('Course not found');
      })
    );
  }
}
