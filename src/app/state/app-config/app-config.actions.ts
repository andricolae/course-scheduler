import { createAction, props } from '@ngrx/store';
import { AppConfig } from '../../core/user.model';

export const loadAppConfig = createAction(
  '[AppConfig] Load App Config'
);

export const loadAppConfigSuccess = createAction(
  '[AppConfig] Load App Config Success',
  props<{ config: AppConfig }>()
);

export const loadAppConfigFailure = createAction(
  '[AppConfig] Load App Config Failure',
  props<{ error: string }>()
);

export const updateAppConfig = createAction(
  '[AppConfig] Update App Config',
  props<{ config: AppConfig }>()
);

export const updateAppConfigSuccess = createAction(
  '[AppConfig] Update App Config Success',
  props<{ config: AppConfig }>()
);

export const updateAppConfigFailure = createAction(
  '[AppConfig] Update App Config Failure',
  props<{ error: string }>()
);

export const toggleScheduleOverlapSetting = createAction(
  '[AppConfig] Toggle Schedule Overlap Setting',
  props<{ allowOverlap: boolean }>()
);
