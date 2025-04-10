import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UsersState } from './user.reducer';

export const selectUsersState = createFeatureSelector<UsersState>('users');

export const selectAllUsers = createSelector(
  selectUsersState,
  (state) => state.users
);

export const selectUsersLoading = createSelector(
  selectUsersState,
  (state) => state.loading
);

export const selectUsersError = createSelector(
  selectUsersState,
  (state) => state.error
);

export const selectIsLoading = createSelector(
  selectUsersState,
  (state) => state.loading
);

export const selectUser = createSelector(
  selectUsersState,
  (state) => state.users
);
