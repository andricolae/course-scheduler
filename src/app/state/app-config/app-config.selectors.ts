import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppConfigState } from './app-config.reducer';

export const selectAppConfigState = createFeatureSelector<AppConfigState>('appConfig');

export const selectAppConfig = createSelector(
  selectAppConfigState,
  state => state.config
);

export const selectAppConfigLoading = createSelector(
  selectAppConfigState,
  state => state.loading
);

export const selectAppConfigError = createSelector(
  selectAppConfigState,
  state => state.error
);

export const selectAllowTeacherScheduleOverlap = createSelector(
  selectAppConfig,
  config => config?.allowTeacherScheduleOverlap ?? false
);
