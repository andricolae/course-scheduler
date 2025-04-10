import { createAction, props } from '@ngrx/store';
import { UserModel } from '../../core/user.model';

export const loadUsers = createAction('[Users] Load Users');

export const loadUsersSuccess = createAction(
    '[Users] Load Users Success',
    props<{ users: UserModel[] }>()
);

export const loadUsersFail = createAction(
    '[Users] Load Users Fail',
    props<{ error: string }>()
);

export const deleteUser = createAction(
    '[Users] Delete User',
    props<{ userId: string }>()
);

export const deleteUserSuccess = createAction(
    '[Users] Delete User Success',
    props<{ userId: string }>()
);

export const deleteUserFail = createAction(
    '[Users] Delete User Fail',
    props<{ error: string }>()
);

export const updateUser = createAction(
  '[Users] Update User',
  props<{ user: UserModel }>()
);

export const updateUserSuccess = createAction(
  '[Users] Update User Success',
  props<{ user: UserModel }>()
);

export const updateUserFail = createAction(
  '[Users] Update User Fail',
  props<{ error: string }>()
);

export const getUser = createAction(
  '[User] Load User',
  props<{ user: UserModel }>()
)

export const getUserSuccess = createAction(
  '[Users] Load User Success',
  props<{ user: UserModel }>()
);

export const getUserFail = createAction(
  '[Users] Load Users Fail',
  props<{ error: string }>()
);
