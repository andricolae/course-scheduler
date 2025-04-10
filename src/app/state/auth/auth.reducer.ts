import { createReducer, on } from '@ngrx/store';
import { User } from '../../core/user.model';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: User | null;
  authError: string | null;
  successMessage: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  authError: null,
  successMessage: null,
  loading: false
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.loginStart, AuthActions.signupStart, (state) => ({
    ...state,
    authError: null,
    successMessage: null,
    loading: true
  })),
  on(AuthActions.loginSuccess, (state, action) => ({
    ...state,
    user: action.user,
    authError: null,
    loading: false
  })),
  on(AuthActions.loginFail, AuthActions.signupFail, (state, action) => ({
    ...state,
    authError: action.error,
    loading: false
  })),
  on(AuthActions.signupSuccess, (state, action) => ({
    ...state,
    successMessage: action.message,
    authError: null,
    loading: false
  })),
  on(AuthActions.logout, (state) => ({
    ...state,
    user: null
  })),

  on(AuthActions.resetPasswordStart, (state) => ({
    ...state,
    authError: null,
    successMessage: null,
    loading: true
  })),
  on(AuthActions.resetPasswordSuccess, (state, action) => ({
    ...state,
    successMessage: action.message,
    authError: null,
    loading: false
  })),
  on(AuthActions.resetPasswordFail, (state, action) => ({
    ...state,
    authError: action.error,
    loading: false
  }))


);
