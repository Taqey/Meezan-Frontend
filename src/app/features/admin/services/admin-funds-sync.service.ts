import { Injectable } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { ApiService } from '../../../core/api/api.service';
import { FundSyncSettings, FundSyncLog, FundSyncSettingsUpdateRequest, FundPriceSyncResultDto, FundSyncStatusDto } from '../../../shared/models/api.models';
import { normFundSyncStatus, fundSyncStatusLabelAr, fundSyncStatusColor } from '../../../shared/models/fund-display';

@Injectable({ providedIn: 'root' })
export class AdminFundsSyncService {
  constructor(
    private api: ApiService,
    private toast: ToastService
  ) {}

  // Funds Sync state
  fundSyncSettings?: FundSyncSettings;

  fundSyncLoading = false;

  fundSyncRunning = false;

  fundPriceSyncRunning = false;

  fundHistoricalSyncRunning = false;

  fundCombinedSyncRunning = false;

  fundCheckNewRunning = false;

  fundSyncStatus?: FundSyncStatusDto | null;

  fundPriceSyncResult?: FundPriceSyncResultDto | null;

  fundPriceSyncError: string | null = null;

  fundCheckNewResult?: { totalSndukFunds: number; existingFundsCount: number; newFundsAddedCount: number; durationSeconds: number } | null;

  fundCheckNewError: string | null = null;

  fundCombinedMessage: string | null = null;

  fundSyncRunResult?: FundSyncLog | null;

  fundSyncRunError: string | null = null;

  fundSyncHistory: FundSyncLog[] = [];

  fundSyncHistoryLoading = false;

  fundSyncHistoryPage = 1;

  fundSyncHistoryPageSize = 20;

  fundSyncHistoryTotalPages = 0;

  fundSyncHistoryTotalCount = 0;

  adminFundPickerList: { id: number; code: string; nameAr: string; displayName?: string | null }[] = [];

  // Funds Sync methods
  loadFundSyncSettings(): void {
    this.fundSyncLoading = true;
    this.api.getFundSyncSettings().subscribe({
      next: (settings) => {
        this.fundSyncSettings = this.normalizeSyncSettings(settings);
        this.fundSyncLoading = false;
      },
      error: () => {
        this.fundSyncLoading = false;
      }
    });
  }

  /** The API returns runTimeCairo as "HH:mm:ss"; the time input needs "HH:mm". */
  private normalizeSyncSettings(settings: FundSyncSettings): FundSyncSettings {
    return {
      ...settings,
      runTimeCairo: (settings.runTimeCairo || '00:00').slice(0, 5)
    };
  }

  /** Enable/disable toggle: flips locally, saves, then syncs state from the server response. */
  toggleFundSync(): void {
    if (!this.fundSyncSettings || this.fundSyncLoading) return;
    const previous = this.fundSyncSettings.isEnabled;
    this.fundSyncSettings = { ...this.fundSyncSettings, isEnabled: !previous };
    this.saveFundSyncSettings(previous);
  }

  /** Run-time picker: saves immediately (no popup), updates from the server response. */
  onFundSyncTimeChange(value: string): void {
    if (!this.fundSyncSettings || this.fundSyncLoading) return;
    this.fundSyncSettings = { ...this.fundSyncSettings, runTimeCairo: value };
    this.saveFundSyncSettings();
  }

  private saveFundSyncSettings(revertEnabled?: boolean): void {
    if (!this.fundSyncSettings) return;
    const request: FundSyncSettingsUpdateRequest = {
      isEnabled: this.fundSyncSettings.isEnabled,
      runTimeCairo: this.fundSyncSettings.runTimeCairo,
      preventOverlap: this.fundSyncSettings.preventOverlap,
      requestDelaySeconds: this.fundSyncSettings.requestDelaySeconds,
      maxRetries: this.fundSyncSettings.maxRetries,
      retryBackoffSeconds: this.fundSyncSettings.retryBackoffSeconds
    };
    this.fundSyncLoading = true;
    this.api.updateFundSyncSettings(request).subscribe({
      next: (settings) => {
        this.fundSyncSettings = this.normalizeSyncSettings(settings);
        this.fundSyncLoading = false;
        this.toast.show('تم حفظ إعدادات مزامنة الصناديق');
      },
      error: (err) => {
        if (revertEnabled !== undefined && this.fundSyncSettings) {
          this.fundSyncSettings = { ...this.fundSyncSettings, isEnabled: revertEnabled };
        }
        this.fundSyncLoading = false;
        this.toast.show('فشل حفظ الإعدادات: ' + (err.error?.message || err.message || 'خطأ غير متوقع'));
      }
    });
  }

  fetchFundSyncStatus(): void {
    this.api.getFundSyncStatus().subscribe({
      next: (status) => {
        this.fundSyncStatus = status;
        if (status.isRunning) {
          if (status.mode === 'Prices') {
            this.fundPriceSyncRunning = true;
          } else {
            this.fundSyncRunning = true;
          }
        } else {
          if (this.fundPriceSyncRunning || this.fundSyncRunning) {
            this.loadFundSyncHistory();
          }
          this.fundPriceSyncRunning = false;
          this.fundSyncRunning = false;
        }
      },
      error: () => {}
    });
  }

  get isAnyFundOperationRunning(): boolean {
    return this.fundPriceSyncRunning ||
      this.fundHistoricalSyncRunning ||
      this.fundCombinedSyncRunning ||
      this.fundCheckNewRunning ||
      (this.fundSyncStatus?.isRunning ?? false);
  }

  loadAdminFundPickerList(): void {
    if (this.adminFundPickerList.length > 0) return;
    this.api.getAllFundsAdmin(undefined, undefined, 1, 200).subscribe({
      next: (res) => {
        this.adminFundPickerList = (res.items || []).map(f => ({
          id: f.id,
          code: f.code,
          nameAr: f.nameAr,
          displayName: f.displayName
        }));
      },
      error: () => {}
    });
  }

  runFundPriceSyncNow(): void {
    if (this.isAnyFundOperationRunning) return;
    this.fundPriceSyncRunning = true;
    this.fundPriceSyncError = null;
    this.fundPriceSyncResult = null;
    this.fetchFundSyncStatus();
    this.api.runFundPriceSyncNow().subscribe({
      next: (res) => {
        this.fundPriceSyncResult = res;
        this.fundPriceSyncRunning = false;
        this.loadFundSyncHistory();
        this.fetchFundSyncStatus();
        this.toast.show(`تم تحديث أسعار ${res.updatedFunds} صندوق في ${res.durationSeconds} ثانية`);
      },
      error: (err) => {
        this.fundPriceSyncRunning = false;
        this.fetchFundSyncStatus();
        this.fundPriceSyncError = err.error?.message || err.message || 'فشل تحديث أسعار الصناديق';
        this.toast.show('فشل تحديث أسعار الصناديق: ' + this.fundPriceSyncError);
      }
    });
  }

  getFundPriceSyncLastRunText(): string {
    const latest = this.fundSyncHistory.find(h => h.mode === 'Prices');
    if (latest) {
      return `${new Date(latest.runAt).toLocaleString('ar-EG')} (${fundSyncStatusLabelAr(normFundSyncStatus(latest.status))}) - ${latest.updatedFunds} صندوق`;
    }
    return 'لا يوجد تشغيل سابق';
  }

  getFundHistoricalSyncLastRunText(): string {
    const latest = this.fundSyncHistory.find(h => h.mode === 'Historical');
    if (latest) {
      return `${new Date(latest.runAt).toLocaleString('ar-EG')} (${fundSyncStatusLabelAr(normFundSyncStatus(latest.status))}) - ${latest.updatedFunds} صندوق`;
    }
    return 'لا يوجد تشغيل سابق';
  }

  getFundNewCheckLastRunText(): string {
    const latest = this.fundSyncHistory.find(h => h.mode === 'NewFunds');
    if (latest) {
      return `${new Date(latest.runAt).toLocaleString('ar-EG')} (${fundSyncStatusLabelAr(normFundSyncStatus(latest.status))}) - ${latest.updatedFunds} صندوق جديد`;
    }
    return 'لا يوجد تشغيل سابق';
  }

  // 1-c) Prices + Historical Data combined
  runPricesAndHistoricalSync(): void {
    if (this.isAnyFundOperationRunning) return;
    this.fundCombinedSyncRunning = true;
    this.fundCombinedMessage = 'المرحلة 1 من 2: جاري تحديث الأسعار اليومية...';
    this.api.runFundPriceSyncNow().subscribe({
      next: (pRes) => {
        this.fundCombinedMessage = `تم تحديث أسعار ${pRes.updatedFunds} صندوق. المرحلة 2 من 2: جاري فحص وتعبئة البيانات التاريخية...`;
        this.api.commitHistoricalFundData(null, false).subscribe({
          next: (hRes) => {
            this.fundCombinedSyncRunning = false;
            this.fundCombinedMessage = `اكتمل بنجاح: تم تحديث أسعار ${pRes.updatedFunds} صندوق وإضافة ${hRes.insertedCount} نقطة تاريخية ناقصة.`;
            this.loadFundSyncHistory();
            this.fetchFundSyncStatus();
            this.toast.show('اكتمل تحديث الأسعار + البيانات التاريخية بنجاح');
          },
          error: (hErr) => {
            this.fundCombinedSyncRunning = false;
            this.fundCombinedMessage = `تم تحديث الأسعار ولكن فشلت المزامنة التاريخية: ${hErr.error?.message || hErr.message}`;
            this.loadFundSyncHistory();
          }
        });
      },
      error: (pErr) => {
        this.fundCombinedSyncRunning = false;
        this.fundCombinedMessage = `فشل تحديث الأسعار: ${pErr.error?.message || pErr.message}`;
      }
    });
  }

  // 1-d) Check for new funds
  runCheckNewFundsNow(): void {
    if (this.isAnyFundOperationRunning) return;
    this.fundCheckNewRunning = true;
    this.fundCheckNewError = null;
    this.fundCheckNewResult = null;
    this.api.checkNewFundsNow().subscribe({
      next: (res) => {
        this.fundCheckNewResult = res;
        this.fundCheckNewRunning = false;
        this.loadFundSyncHistory();
        this.fetchFundSyncStatus();
        this.toast.show(`اكتمل فحص الصناديق: تم اكتشاف وإضافة ${res.newFundsAddedCount} صندوق جديد`);
      },
      error: (err) => {
        this.fundCheckNewRunning = false;
        this.fundCheckNewError = err.error?.message || err.message || 'فشل فحص الصناديق الجديدة';
        this.toast.show('فشل فحص الصناديق: ' + this.fundCheckNewError);
      }
    });
  }

  loadFundSyncHistory(page = 1): void {
    this.fundSyncHistoryLoading = true;
    this.fundSyncHistoryPage = page;
    this.api.getFundSyncHistory(page, this.fundSyncHistoryPageSize).subscribe({
      next: (res) => {
        this.fundSyncHistory = res.items;
        this.fundSyncHistoryTotalCount = res.totalCount;
        this.fundSyncHistoryTotalPages = res.totalPages;
        this.fundSyncHistoryLoading = false;
      },
      error: () => {
        this.fundSyncHistoryLoading = false;
      }
    });
  }

  getFundSyncLastRunText(): string {
    const latest = this.fundSyncHistory[0];
    if (latest) {
      return `${new Date(latest.runAt).toLocaleString('ar-EG')} (${fundSyncStatusLabelAr(normFundSyncStatus(latest.status))})`;
    }
    return this.fundSyncSettings ? 'لا يوجد تشغيل سابق' : 'لا يوجد سجل سابق';
  }

  getFundSyncStatusLabel(status: unknown): string {
    return fundSyncStatusLabelAr(normFundSyncStatus(status));
  }

  getFundSyncStatusColor(status: unknown): string {
    return fundSyncStatusColor(normFundSyncStatus(status));
  }

  fundSyncRunResultText(): string {
    const r = this.fundSyncRunResult;
    if (!r) return '';
    const label = fundSyncStatusLabelAr(normFundSyncStatus(r.status));
    const head = label === 'نجح' ? 'اكتمل بنجاح' : label;
    return `${head}: تم تحديث ${r.updatedFunds} من ${r.totalFunds} صندوق`;
  }

  get isFundSyncRunning(): boolean {
    return this.fundSyncRunning || this.fundPriceSyncRunning || (this.fundSyncStatus?.isRunning ?? false);
  }
}
