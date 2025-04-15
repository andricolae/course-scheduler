import { createReducer, on } from '@ngrx/store';
import { AppConfig } from '../../core/user.model';
import * as AppConfigActions from './app-config.actions';

export interface AppConfigState {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
}

export const initialState: AppConfigState = {
  config: null,
  loading: false,
  error: null
};

export const appConfigReducer = createReducer(
  initialState,

  on(AppConfigActions.loadAppConfig, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AppConfigActions.loadAppConfigSuccess, (state, { config }) => ({
    ...state,
    config,
    loading: false,
    error: null
  })),

  on(AppConfigActions.loadAppConfigFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(AppConfigActions.updateAppConfig, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AppConfigActions.updateAppConfigSuccess, (state, { config }) => ({
    ...state,
    config,
    loading: false,
    error: null
  })),

  on(AppConfigActions.updateAppConfigFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(AppConfigActions.toggleScheduleOverlapSetting, (state, { allowOverlap }) => {
    if (!state.config) return state;

    return {
      ...state,
      config: {
        ...state.config,
        allowTeacherScheduleOverlap: allowOverlap
      }
    };
  })
);
