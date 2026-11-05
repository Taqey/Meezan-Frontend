import { Injectable } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { ApiService } from '../../../core/api/api.service';
import { AdminFundsSyncService } from './admin-funds-sync.service';

@Injectable({ providedIn: 'root' })
export class AdminHistoricalSyncService {
  constructor(
    private api: ApiService,
    private toast: ToastService,
    private fundsSync: AdminFundsSyncService
  ) {}

  // Historical Sync modal & preview state
  showHistoricalModal = false;

  historicalSelectedFundId: number | null = null;

  historicalPreviewLoading = false;

  historicalCommitLoading = false;

  historicalPreview?: { totalFundsChecked: number; totalMissingCount: number; totalDifferentCount: number; funds: any[] } | null;

  historicalCommitResult?: { insertedCount: number; overwrittenCount: number; fundsUpdated: number; durationSeconds: number } | null;

  historicalError: string | null = null;

  overwriteDifferentChoice = false;

  // 1-b) Historical sync modal actions
  openHistoricalSyncModal(): void {
    this.showHistoricalModal = true;
    this.historicalError = null;
    this.historicalCommitResult = null;
    this.fundsSync.loadAdminFundPickerList();
    if (!this.historicalPreview) {
      this.fetchHistoricalPreview();
    }
  }

  closeHistoricalSyncModal(): void {
    this.showHistoricalModal = false;
  }

  fetchHistoricalPreview(): void {
    this.historicalPreviewLoading = true;
    this.historicalError = null;
    this.historicalCommitResult = null;
    this.api.previewHistoricalFundData(this.historicalSelectedFundId).subscribe({
      next: (res) => {
        this.historicalPreview = res;
        this.historicalPreviewLoading = false;
      },
      error: (err) => {
        this.historicalPreviewLoading = false;
        this.historicalError = err.error?.message || err.message || 'فشل جلب المعاينة التاريخية';
      }
    });
  }

  commitHistoricalSync(overwriteDifferent: boolean = false): void {
    this.historicalCommitLoading = true;
    this.overwriteDifferentChoice = overwriteDifferent;
    this.historicalError = null;
    this.api.commitHistoricalFundData(this.historicalSelectedFundId, overwriteDifferent).subscribe({
      next: (res) => {
        this.historicalCommitResult = res;
        this.historicalCommitLoading = false;
        this.fundsSync.loadFundSyncHistory();
        this.fundsSync.fetchFundSyncStatus();
        this.fetchHistoricalPreview();
        this.toast.show(`اكتمل حفظ البيانات التاريخية: تمت إضافة ${res.insertedCount} نقطة ناقصة`);
      },
      error: (err) => {
        this.historicalCommitLoading = false;
        this.historicalError = err.error?.message || err.message || 'فشل حفظ البيانات التاريخية';
        this.toast.show('فشل حفظ البيانات التاريخية: ' + this.historicalError);
      }
    });
  }

  confirmOverwriteDifferent(): void {
    const count = this.historicalPreview?.totalDifferentCount || 0;
    if (confirm(`تحذير: هل أنت متأكد من تحديث ${count} نقطة تاريخية بقيم المصدر SNDUK بدلاً من قيم Meezan؟`)) {
      this.commitHistoricalSync(true);
    }
  }
}
