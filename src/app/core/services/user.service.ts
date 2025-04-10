import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, deleteDoc, doc, updateDoc, query, getDocs, where } from '@angular/fire/firestore';
import { from, map, Observable } from 'rxjs';
import { User, UserModel } from '../user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersCollection;

  constructor(private firestore: Firestore) {
    this.usersCollection = collection(this.firestore, 'users');
  }

  getUsers(): Observable<UserModel[]> {
    return collectionData(this.usersCollection, { idField: 'id' }) as Observable<UserModel[]>;
  }

  getUser(user: UserModel): Observable<UserModel | null> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('email', '==', user.email));
    return from(getDocs(q)).pipe( map(snapshot => {
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data() as UserModel;
        return userData;
      }
      return null;
    }));
  }

  deleteUser(userId: string): Observable<void> {
    const userDoc = doc(this.firestore, `users/${userId}`);
    return from(deleteDoc(userDoc));
  }

  updateUser(user: UserModel): Observable<void> {
    const userDoc = doc(this.firestore, `users/${user.id}`);
    const { id, ...userWithoutId } = user;
    return from(updateDoc(userDoc, userWithoutId));
  }
}
