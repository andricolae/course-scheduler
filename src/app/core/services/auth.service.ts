import { inject, Injectable, PLATFORM_ID, signal } from "@angular/core";
import { BehaviorSubject, catchError, from, map, Observable, switchMap, take, tap, throwError } from "rxjs";
import { User } from "../user.model";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import { DbService } from "../services/db.service";
import { firebaseConfig } from '../../../../environment';
import { isPlatformBrowser } from "@angular/common";
import { Store } from "@ngrx/store";
import * as LogActions from '../../state/logs/log.actions';
import { LogCategory } from '../log.model';

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
  private store = inject(Store, { optional: true });

  user = new BehaviorSubject<User | null>(null);
  isLogged = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    private dbService: DbService,
  ) {
    this.autoLogin();
  }

  private logAuthAction(action: string, details?: any): void {
    this.store!.dispatch(LogActions.addLog({
      log: {
        timestamp: Date.now(),
        userId: this.user.value?.id,
        userRole: this.user.value?.role,
        category: LogCategory.AUTH,
        action,
        details
      }
    }));
  }

  signup(email: string, password: string, fullName: string, role: string): Observable<AuthResponseData> {
    const hashedPassword = btoa(password);
    this.logAuthAction('SIGNUP_ATTEMPT', { email, fullName, role });

    return this.http.post<AuthResponseData>(this.signUpUrl, {
      email,
      password,
      fullName,
      role,
      returnSecureToken: true
    }).pipe(
      tap((res) => {
        console.log('AuthService SIGNUP success:', res);
        this.logAuthAction('SIGNUP_SUCCESS', { email, role });
      }),
      switchMap((resData) => {
        if (!resData.localId) {
          this.logAuthAction('SIGNUP_FAILED', { email, error: 'User creation failed' });
          return throwError(() => new Error("User creation failed"));
        }
        return this.sendVerificationEmail(resData.idToken).pipe(
          switchMap(() => {
            this.logAuthAction('VERIFICATION_EMAIL_SENT', { email });
            return this.dbService.saveUserProfile(resData.localId, email, hashedPassword, fullName, role)
          }),
          map(() => resData)
        );
      }),
      catchError((err) => {
        console.error('AuthService SIGNUP error:', err);
        this.logAuthAction('SIGNUP_ERROR', { email, error: err.message });
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
    const userEmail = this.user.value?.email;
    this.user.next(null);
    console.log('Logging out...');
    this.logAuthAction('LOGOUT', { email: userEmail });
    localStorage.removeItem('userData');
    this.router.navigate(['/auth']);
  }

  private handleAuthentification(email: string, userId: string, token: string, expiresIn: number) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate, 'Student');
    this.user.next(user);
    this.logAuthAction('USER_AUTHENTICATED', { email, userId, role: user.role });
    localStorage.setItem('userData', JSON.stringify({
        email: user.email,
        id: user.id,
        _token: user.token,
        _tokenExpirationDate: expirationDate.toISOString(),
        role: user.role
    }));
  }

  login(email: string, password: string): Observable<User> {
    this.logAuthAction('LOGIN_ATTEMPT', { email });

    return this.http.post<AuthResponseData>(this.loginUrl, {
      email,
      password,
      returnSecureToken: true
    }).pipe(
      switchMap((resData) => {
        return this.checkEmailVerification(resData.idToken).pipe(
          switchMap((isVerified) => {
            if (!isVerified) {
              this.logAuthAction('LOGIN_FAILED', { email, reason: 'Email not verified' });
              return throwError(() => ({
                error: { error: { message: 'EMAIL_NOT_VERIFIED' } }
              }));
            }
            return this.dbService.getUserProfile(resData.localId).pipe(
              map((profileData) => {
                if (!profileData) {
                  this.logAuthAction('LOGIN_FAILED', { email, reason: 'User profile not found' });
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
                this.logAuthAction('LOGIN_SUCCESS', { email, userId: user.id, role: user.role });

                console.log('Login complete, user with roles:', user);

                return user;
              })
            );
          })
        );
      }),
      catchError((error) => {
        this.logAuthAction('LOGIN_ERROR', { email, error: error.message });
        return this.handleError(error);
      })
    );
  }

  updateUserPassword(newPassword: string): Observable<any> {
    return this.user.pipe(
      take(1),
      switchMap(user => {
        if (!user || !user.token) {
          this.logAuthAction('PASSWORD_UPDATE_FAILED', { reason: 'No authenticated user' });
          return throwError(() => new Error('No authenticated user!'));
        }
        this.logAuthAction('PASSWORD_UPDATE_ATTEMPT', { userId: user.id });

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
          tap(() => {
            this.logAuthAction('PASSWORD_UPDATE_SUCCESS', { userId: user.id });
            console.log('Password successfully updated in Firebase Authentication and Firestore.')
          }),
          catchError((error) => {
            this.logAuthAction('PASSWORD_UPDATE_ERROR', { userId: user.id, error: error.message });
            return this.handleError(error);
          })
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
    this.logAuthAction('PASSWORD_RESET_REQUEST', { email });

    return this.http.post<any>(this.resetPasswordUrl, {
      requestType: "PASSWORD_RESET",
      email
    }).pipe(
      tap(() => {
        this.logAuthAction('PASSWORD_RESET_EMAIL_SENT', { email });
      }),
      catchError((error) => {
        this.logAuthAction('PASSWORD_RESET_ERROR', { email, error: error.message });
        return this.handleError(error);
      })
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
        this.logAuthAction('AUTO_LOGIN_SUCCESS', {
          email: loadedUser.email,
          userId: loadedUser.id,
          role: loadedUser.role
        });
      } else {
        this.logAuthAction('AUTO_LOGIN_TOKEN_EXPIRED', { email: loadedUser.email });
      }
    } catch (error) {
      console.error("Auto login failed", error);
      this.logAuthAction('AUTO_LOGIN_ERROR', { error: 'Parse error' });
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
