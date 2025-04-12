import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LogState } from './log.reducer';
import { LogCategory } from '../../core/log.model';

export const selectLogState = createFeatureSelector<LogState>('log');

export const selectAllLogs = createSelector(
  selectLogState,
  state => state.logs
);

export const selectLogsLoading = createSelector(
  selectLogState,
  state => state.loading
);

export const selectLogsError = createSelector(
  selectLogState,
  state => state.error
);

export const selectLogsByCategory = (category: LogCategory) => createSelector(
  selectAllLogs,
  logs => logs.filter(log => log.category === category)
);

export const selectAuthLogs = createSelector(
  selectAllLogs,
  logs => logs.filter(log => log.category === LogCategory.AUTH)
);

export const selectNavigationLogs = createSelector(
  selectAllLogs,
  logs => logs.filter(log => log.category === LogCategory.NAVIGATION)
);

export const selectSchedulerLogs = createSelector(
  selectAllLogs,
  logs => logs.filter(log => log.category === LogCategory.SCHEDULER)
);

export const selectSystemLogs = createSelector(
  selectAllLogs,
  logs => logs.filter(log => log.category === LogCategory.SYSTEM)
);

export const selectLogsByUser = (userId: string) => createSelector(
  selectAllLogs,
  logs => logs.filter(log => log.userId === userId)
);

export const selectRecentLogs = (count: number) => createSelector(
  selectAllLogs,
  logs => logs.slice(0, count)
);
