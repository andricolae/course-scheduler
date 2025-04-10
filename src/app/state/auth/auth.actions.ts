import { createAction, props } from '@ngrx/store';
import { User } from '../../core/user.model';

export const loginStart = createAction(
  '[Auth] Login Start',
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User }>()
);

export const loginFail = createAction(
  '[Auth] Login Fail',
  props<{ error: string }>()
);

export const logout = createAction('[Auth] Logout');

export const signupStart = createAction(
  '[Auth] Signup Start',
  props<{ email: string; password: string; name: string; role: string }>()
);

export const signupSuccess = createAction(
  '[Auth] Signup Success',
  props<{ message: string }>()
);

export const signupFail = createAction(
  '[Auth] Signup Fail',
  props<{ error: string }>()
);

export const resetPasswordStart = createAction(
  '[Auth] Reset Password Start',
  props<{ email: string }>()
);

export const resetPasswordSuccess = createAction(
  '[Auth] Reset Password Success',
  props<{ message: string }>()
);

export const resetPasswordFail = createAction(
  '[Auth] Reset Password Fail',
  props<{ error: string }>()
);
