import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { LogEntry, LogCategory } from '../../core/log.model';
import * as LogActions from '../../state/logs/log.actions';
import * as LogSelectors from '../../state/logs/log.selector';
import { SpinnerComponent } from '../../core/spinner/spinner.component';
import { SpinnerService } from '../../core/services/spinner.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-log-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SpinnerComponent,
    NgClass
  ],
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.css']
})
export class LogViewerComponent implements OnInit {
  logs$: Observable<LogEntry[]>;
  loading$: Observable<boolean>;

  filteredLogs: LogEntry[] = [];
  expandedLogId: string | null = null;

  selectedCategory: string = '';
  selectedTimeRange: string = '24h';
  categories = Object.values(LogCategory);

  currentPage: number = 1;
  pageSize: number = 20;

  Math = Math;

  constructor(
    private store: Store,
    private spinner: SpinnerService
  ) {
    this.logs$ = this.store.select(LogSelectors.selectAllLogs);
    this.loading$ = this.store.select(LogSelectors.selectLogsLoading);

    this.store.subscribe(state => {
      console.log('ENTIRE STORE STATE:', state);
    });

    this.logs$ = this.store.select(LogSelectors.selectAllLogs);
    this.loading$ = this.store.select(LogSelectors.selectLogsLoading);
  }

  ngOnInit(): void {
    console.log('LogViewerComponent initialized');
    this.refreshLogs();

    this.logs$.subscribe(logs => {
      console.log('Direct logs$ subscription received logs:', logs);
      console.log('Sample log format:', logs.length > 0 ? logs[0] : 'No logs');
    });

    this.store.dispatch(LogActions.addLog({
      log: {
        timestamp: Date.now(),
        category: LogCategory.SYSTEM,
        action: 'LOG_VIEWER_OPENED',
        details: { timeRange: this.selectedTimeRange }
      }
    }));

    this.loading$.subscribe(loading => {
      console.log('Loading state changed:', loading);
      if (loading) {
        this.spinner.show();
      } else {
        this.spinner.hide();
      }
    });

    this.logs$.subscribe(logs => {
      console.log('Logs received in component:', logs.length);
      this.applyFilters(logs);
      console.log('After filtering, logs count:', this.filteredLogs.length);
      console.log('First few logs:', this.filteredLogs.slice(0, 3));
    });
  }

  refreshLogs(): void {
    console.log('Refreshing logs...');
    this.store.dispatch(LogActions.loadLogs());

    this.logs$.pipe(take(1)).subscribe(logs => {
      console.log(`Current logs in store: ${logs.length}`);
    });
  }

  filterLogs(): void {
    this.logs$.pipe(take(1)).subscribe(logs => {
      this.applyFilters(logs);

      this.currentPage = 1;

      this.store.dispatch(LogActions.addLog({
        log: {
          timestamp: Date.now(),
          category: LogCategory.SYSTEM,
          action: 'LOG_FILTER_CHANGED',
          details: {
            category: this.selectedCategory,
            timeRange: this.selectedTimeRange
          }
        }
      }));
    });
  }

  applyFilters(logs: LogEntry[]): void {
    let filtered = [...logs];

    if (this.selectedCategory) {
      filtered = filtered.filter(log => log.category === this.selectedCategory);
    }

    const now = Date.now();
    let timeThreshold = 0;

    switch (this.selectedTimeRange) {
      case '1h':
        timeThreshold = now - (60 * 60 * 1000);
        break;
      case '6h':
        timeThreshold = now - (6 * 60 * 60 * 1000);
        break;
      case '24h':
        timeThreshold = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeThreshold = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeThreshold = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        timeThreshold = 0;
    }

    if (timeThreshold > 0) {
      filtered = filtered.filter(log => log.timestamp >= timeThreshold);
    }

    filtered = filtered.sort((a, b) => b.timestamp - a.timestamp);

    this.filteredLogs = filtered;
  }

  toggleLogDetails(log: LogEntry): void {
    if (this.expandedLogId === log.id) {
      this.expandedLogId = null;
    } else {
      this.expandedLogId = log.id!;

      this.store.dispatch(LogActions.addLog({
        log: {
          timestamp: Date.now(),
          category: LogCategory.SYSTEM,
          action: 'LOG_DETAILS_VIEWED',
          details: {
            viewedLogId: log.id,
            viewedLogCategory: log.category,
            viewedLogAction: log.action
          }
        }
      }));
    }
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  stringifyDetails(details: any): string {
    return JSON.stringify(details, null, 2);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  getPaginatedLogs(): LogEntry[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    console.log(`Getting paginated logs: page ${this.currentPage}, indices ${startIndex}-${endIndex}, total logs: ${this.filteredLogs.length}`);

    const result = this.filteredLogs.slice(startIndex, endIndex);
    console.log('Returning paginated logs:', result.length);
    return result;
  }

  getDebugInfo(): any {
    return {
      storeLogsCount: 'Checking...',
      filteredLogsCount: this.filteredLogs.length,
      paginatedLogsCount: this.getPaginatedLogs().length,
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      selectedCategory: this.selectedCategory || 'None',
      selectedTimeRange: this.selectedTimeRange,
      sampleLogId: this.filteredLogs.length > 0 ? this.filteredLogs[0].id : 'No logs'
    };
  }
}
