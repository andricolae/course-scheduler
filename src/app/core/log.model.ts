export interface LogEntry {
  id?: string;
  timestamp: number;
  userId?: string;
  userRole?: string;
  category: LogCategory;
  action: string;
  details?: any;
}

export enum LogCategory {
  AUTH = 'AUTH',
  NAVIGATION = 'NAVIGATION',
  SCHEDULER = 'SCHEDULER',
  SYSTEM = 'SYSTEM'
}
