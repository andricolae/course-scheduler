import { Injectable} from "@angular/core";
import { Firestore, doc, getDoc, setDoc, updateDoc } from "@angular/fire/firestore";
import { Observable, from, map, tap } from "rxjs";

@Injectable({ providedIn: 'root' })
export class DbService {
  constructor(private firestore: Firestore) {}

  saveUserProfile(userId: string, email: string, hashedPassword: string, fullName: string, role: string): Observable<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return from(setDoc(userRef, {
      email,
      hashedPassword,
      fullName,
      role
    })).pipe(
      tap(() => console.log(`User profile saved for ${email}`))
    );
  }

  getUserProfile(userId: string): Observable<any> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return from(getDoc(userRef)).pipe(
      map((docSnap) => (docSnap.exists() ? docSnap.data() : null))
    );
  }

  updateUserPassword(userId: string, newPassword: string): Observable<void> {
    const hashedPassword = btoa(newPassword);
    const userRef = doc(this.firestore, `users/${userId}`);
    return from(updateDoc(userRef, { hashedPassword }));
  }
}
