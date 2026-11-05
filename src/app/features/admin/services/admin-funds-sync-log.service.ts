import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { FundSyncLog, FundSyncLogDetail } from '../../../shared/models/api.models';
import { normFundSyncStatus, fundSyncStatusLabelAr, fundSyncStatusColor, normFundSyncDetailStatus, fundSyncDetailStatusLabelAr } from '../../../shared/models/fund-display';

@Injectable({ providedIn: 'root' })
export class AdminFundsSyncLogService {
  constructor(
    private api: ApiService
  ) {}

  // Sync history
  syncRuns: FundSyncLog[] = [];

  syncLoading = false;

  syncPage = 1;

  syncTotalPages = 0;

  selectedRunId: number | null = null;

  runDetails: FundSyncLogDetail[] = [];

  runDetailsLoading = false;

  syncStatusLabel(s: unknown): string { return fundSyncStatusLabelAr(normFundSyncStatus(s)); }

  syncStatusColor(s: unknown): string { return fundSyncStatusColor(normFundSyncStatus(s)); }

  detailStatusLabel(s: unknown): string { return fundSyncDetailStatusLabelAr(normFundSyncDetailStatus(s)); }

  loadSyncHistory(page = 1): void {
    this.syncLoading = true;
    this.syncPage = page;
    this.api.getFundSyncHistory(page, 20).subscribe({
      next: (res) => {
        this.syncRuns = res.items || [];
        this.syncTotalPages = res.totalPages || 0;
        this.syncLoading = false;
      },
      error: () => { this.syncLoading = false; }
    });
  }

  toggleRunDetails(runId: number): void {
    if (this.selectedRunId === runId) {
      this.selectedRunId = null;
      this.runDetails = [];
      return;
    }
    this.selectedRunId = runId;
    this.runDetailsLoading = true;
    this.api.getFundSyncRunDetails(runId).subscribe({
      next: (details) => {
        this.runDetails = (details || []).filter(d => normFundSyncDetailStatus(d.status) !== 'success');
        if (!this.runDetails.length) this.runDetails = details || [];
        this.runDetailsLoading = false;
      },
      error: () => { this.runDetailsLoading = false; }
    });
  }
}
