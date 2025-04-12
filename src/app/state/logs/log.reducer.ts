import { createReducer, on } from '@ngrx/store';
import { LogEntry } from '../../core/log.model';
import * as LogActions from './log.actions';

export interface LogState {
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: LogState = {
  logs: [],
  loading: false,
  error: null
};

export const logReducer = createReducer(
  initialState,

  on(LogActions.addLog, (state, { log }) => ({
    ...state,
    logs: [log, ...state.logs].slice(0, 100)
  })),

  on(LogActions.loadLogs, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(LogActions.loadLogsSuccess, (state, { logs }) => {
    console.log('Reducer: loadLogsSuccess received logs:', logs.length);
    return {
      ...state,
      logs,
      loading: false
    };
  }),

  on(LogActions.loadLogsFail, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
