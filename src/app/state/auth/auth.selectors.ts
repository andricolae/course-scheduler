import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(
  selectAuthState,
  (state) => state.user
);

export const selectIsLoading = createSelector(
  selectAuthState,
  (state) => state.loading
);

export const selectError = createSelector(
  selectAuthState,
  (state) => state.authError
);

export const selectSuccessMessage = createSelector(
  selectAuthState,
  (state) => state.successMessage
);

export const selectIsAuthenticated = createSelector(
  selectUser,
  (user) => !!user
);

export const selectIsProfessor = createSelector(
  selectUser,
  (user) => user?.role === 'Teacher' || false
);

export const selectIsStudent = createSelector(
  selectUser,
  (user) => user?.role === 'Student' || false
);

export const selectIsAdmin = createSelector(
  selectUser,
  (user) => user?.role === 'Admin' || false
);
