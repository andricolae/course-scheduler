import { createReducer, on } from '@ngrx/store';
import * as UserActions from './user.actions';
import { UserModel } from '../../core/user.model';

export interface UsersState {
  users: UserModel[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null
};

export const usersReducer = createReducer(
    initialState,
    on(UserActions.loadUsers, state => ({ ...state, loading: true })),

    on(UserActions.loadUsersSuccess, (state, { users }) => ({
        ...state,
        users,
        loading: false
    })),

    on(UserActions.loadUsersFail, (state, { error }) => ({
        ...state,
        error,
        loading: false
    })),

    on(UserActions.deleteUserSuccess, (state, { userId }) => ({
        ...state,
        users: state.users.filter(u => u.id !== userId)
    })),

    on(UserActions.updateUserSuccess, (state, { user }) => ({
        ...state,
        users: state.users.map(u => u.id === user.id ? user : u)
    })),

    on(UserActions.getUser, (state, { user }) => ({
      ...state,
      user: state.users.map(u => u.email === user.email ? user.email : u)
    })),

    on(UserActions.getUserSuccess, (state, { user }) => ({
      ...state,
      user,
      loading: false
    })),

    on(UserActions.getUserFail, (state, { error }) => ({
        ...state,
        error,
        loading: false
    })),
);
