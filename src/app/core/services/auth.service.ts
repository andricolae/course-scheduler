import { inject, Injectable, PLATFORM_ID, signal } from "@angular/core";
import { BehaviorSubject, catchError, from, map, Observable, switchMap, take, tap, throwError } from "rxjs";
import { User } from "../user.model";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import { DbService } from "../services/db.service";
import { firebaseConfig } from '../../../../environment';
import { isPlatformBrowser } from "@angular/common";

interface AuthResponseData {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiKey = firebaseConfig.apiKey;
  private signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.apiKey}`;
  private loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`;
  private resetPasswordUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`;
  private verifyEmailUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`;
  private getUserDataUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${this.apiKey}`;

  user = new BehaviorSubject<User | null>(null);
  isLogged = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    private dbService: DbService
  ) {
    this.autoLogin();
  }

  signup(email: string, password: string, fullName: string, role: string): Observable<AuthResponseData> {
    const hashedPassword = btoa(password);
    return this.http.post<AuthResponseData>(this.signUpUrl, {
      email,
      password,
      fullName,
      role,
      returnSecureToken: true
    }).pipe(
      tap((res) => console.log('AuthService SIGNUP success:', res)),
      switchMap((resData) => {
        if (!resData.localId) {
          return throwError(() => new Error("User creation failed"));
        }
        return this.sendVerificationEmail(resData.idToken).pipe(
          switchMap(() =>
            this.dbService.saveUserProfile(resData.localId, email, hashedPassword, fullName, role)
          ),
          map(() => resData)
        );
      }),
      catchError((err) => {
        console.error('AuthService SIGNUP error:', err);
        return this.handleError(err);
      })
    );
  }

  sendVerificationEmail(idToken: string): Observable<any> {
    return this.http.post<any>(this.verifyEmailUrl, {
      requestType: "VERIFY_EMAIL",
      idToken
    }).pipe(
      catchError(this.handleError)
    );
  }

  logout() {
    this.user.next(null);
    console.log('Logging out...');
    localStorage.removeItem('userData');
    this.router.navigate(['/auth']);
  }

  private handleAuthentification(email: string, userId: string, token: string, expiresIn: number) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate, 'Student');
    this.user.next(user);
    localStorage.setItem('userData', JSON.stringify({
        email: user.email,
        id: user.id,
        _token: user.token,
        _tokenExpirationDate: expirationDate.toISOString(),
        role: user.role
    }));
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<AuthResponseData>(this.loginUrl, {
      email,
      password,
      returnSecureToken: true
    }).pipe(
      switchMap((resData) => {
        return this.checkEmailVerification(resData.idToken).pipe(
          switchMap((isVerified) => {
            if (!isVerified) {
              return throwError(() => ({
                error: { error: { message: 'EMAIL_NOT_VERIFIED' } }
              }));
            }
            return this.dbService.getUserProfile(resData.localId).pipe(
              map((profileData) => {
                if (!profileData) {
                  throw new Error('User profile not found in Firestore.');
                }
                const roles = profileData.role ?? ['Student'];
                const expirationDate = new Date(new Date().getTime() + +resData.expiresIn * 1000);
                const user = new User(resData.email, resData.localId, resData.idToken, expirationDate, roles);

                this.user.next(user);
                localStorage.setItem('userData', JSON.stringify({
                  email: user.email,
                  id: user.id,
                  _token: user.token,
                  _tokenExpirationDate: expirationDate.toISOString(),
                  role: user.role
                }));

                console.log('Login complete, user with roles:', user);

                return user;
              })
            );
          })
        );
      }),
      catchError(this.handleError)
    );
  }

  updateUserPassword(newPassword: string): Observable<any> {
    return this.user.pipe(
      take(1),
      switchMap(user => {
        if (!user || !user.token) {
          return throwError(() => new Error('No authenticated user!'));
        }
        return this.http.post<any>(
          `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${this.apiKey}`,
          {
            idToken: user.token,
            password: newPassword,
            returnSecureToken: true
          }
        ).pipe(
          switchMap(resData => {
            return from(this.dbService.updateUserPassword(user.id, newPassword)).pipe(
              map(() => resData)
            );
          }),
          tap(() => console.log('Password successfully updated in Firebase Authentication and Firestore.')),
          catchError(this.handleError)
        );
      })
    );
  }

  checkEmailVerification(idToken: string): Observable<boolean> {
    return this.http.post<any>(this.getUserDataUrl, { idToken }).pipe(
      map((res) => {
        const user = res.users ? res.users[0] : null;
        console.log('User:', user);
        console.log('Email verified:', user?.emailVerified);
        return user?.emailVerified || false;
      }),
      catchError(this.handleError)
    );
  }

  resetPassword(email: string): Observable<any> {
    return this.http.post<any>(this.resetPasswordUrl, {
      requestType: "PASSWORD_RESET",
      email
    }).pipe(
      catchError(this.handleError)
    );
  }

  autoLogin() {
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      return;
    }

    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      return;
    }
    try {
      const userDataObj = JSON.parse(userDataStr);
      const loadedUser = new User(
        userDataObj.email,
        userDataObj.id,
        userDataObj._token,
        new Date(userDataObj._tokenExpirationDate),
        userDataObj.role ?? []
      );
      if (loadedUser.token) {
        this.user.next(loadedUser);
      }
    } catch (error) {
      console.error("Auto login failed", error);
    }
  }

  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (!errorRes.error || !errorRes.error.error) {
      return throwError(() => new Error(errorMessage));
    }
    switch (errorRes.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email exists already.';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'Credentials were not found.';
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'Credentials were not found.';
        break;
      case 'INVALID_LOGIN_CREDENTIALS':
        errorMessage = 'Invalid login credentials.';
        break;
      case 'USER_DISABLED':
        errorMessage = 'This user has been disabled.';
        break;
      case 'INVALID_ID_TOKEN':
        errorMessage = 'Invalid session token. Please login again.';
        break;
      case 'EMAIL_NOT_VERIFIED':
        errorMessage = 'Please verify your email before logging in.';
        break;
    }
    return throwError(() => new Error(errorMessage));
  }
}
