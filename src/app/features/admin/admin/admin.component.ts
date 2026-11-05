import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { SessionCacheService } from '../../../core/services/session-cache.service';
import {
  LucideAngularModule,
  Upload,
  RefreshCw,
  Database,
  History,
  CheckCircle,
  AlertTriangle,
  Play,
  Search,
  Save,
  RotateCcw,
  LogOut,
  Calendar,
  Clock,
  Edit3,
  FileText,
  Upload as UploadIcon,
  X,
  AlertCircle,
  Check,
  ShieldCheck,
  Layers,
  LineChart
} from 'lucide-angular';
import { ApiService } from '../../../core/api/api.service';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import {
  IndexSummaryDto,
  LiveProgressInfo,
  MarketDataDto,
  ManualMarketDataUpdateRequest,
  ManualMarketDataUpdateResponse,
  AdminStockLookupItem,
  RefreshMarketSnapshotsResult,
  RefreshShariahDataResult,
  RunCombinedScrapeResult,
  ScrapeStatusResponse,
  SeedShariahResultDto,
  SourcePdfStatusDto,
  StockListItemDto,
  UploadIndexFileResultDto,
  RemovalCandidateDto,
  RefreshSelectedStocksResult,
  StockManagementItem,
  SectorPickerItem,
  IndexPickerItem,
  ShariahOverridesDto,
  SaveShariahOverridesRequest,
  FundSyncSettings,
  FundSyncLog,
  FundSyncSettingsUpdateRequest,
  FundSyncLogDetail,
  FundPriceSyncResultDto,
  FundSyncStatusDto
} from '../../../shared/models/api.models';
import {
  SHARIAH_STANDARDS,
  scholarsDebtMax,
  SCHOLARS_STANDARD_NAME_AR,
  SCHOLARS_STANDARD_NAME_EN,
  evaluateStandards,
  resolveVerdictWithScholars,
  isViaScholarsOnly
} from '../../../shared/models/shariah-standards';
import {
  normFundSyncStatus,
  fundSyncStatusLabelAr,
  fundSyncStatusColor
} from '../../../shared/models/fund-display';

interface EditableMarketForm {
  closingPrice: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  nominalValue: number | null;
  bookValue: number | null;
  eps: number | null;
  marketValue: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  sharesOutstanding: number | null;
  earningsGrowthRate: number | null;
  epsGrowthRate: number | null;
  freeCashFlow: number | null;
  currency: string;
  sourceLastUpdateText: string;
  recalculateRatios: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit, OnDestroy {
  readonly UploadIcon = Upload;
  readonly PlayIcon = Play;
  readonly RefreshCwIcon = RefreshCw;
  readonly DatabaseIcon = Database;
  readonly HistoryIcon = History;
  readonly SearchIcon = Search;
  readonly SaveIcon = Save;
  readonly RotateCcwIcon = RotateCcw;
  readonly LogOutIcon = LogOut;
  readonly CalendarIcon = Calendar;
  readonly ClockIcon = Clock;
  readonly Edit3Icon = Edit3;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly FileTextIcon = FileText;
  readonly UploadFileIcon = UploadIcon;
  readonly XIcon = X;
  readonly AlertCircleIcon = AlertCircle;
  readonly CheckCircleIcon = CheckCircle;
  readonly CheckIcon = Check;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly LayersIcon = Layers;
  readonly LineChartIcon = LineChart;

  activeTab: 'scraping' | 'market-data' | 'upload' | 'shariah' | 'pdf-upload' | 'review' | 'stocks' | 'shariah-edit' = 'scraping';

  indices: IndexSummaryDto[] = [];
  allStocks: AdminStockLookupItem[] = [];
  filteredStocks: AdminStockLookupItem[] = [];
  stockSearchQuery = '';
  selectedTicker = '';

  // Market Data Editor tab
  selectedStockMarketData?: MarketDataDto;
  loadingStock = false;
  savingMarketData = false;
  saveError = '';
  saveSuccessResult?: ManualMarketDataUpdateResponse;

  marketForm: EditableMarketForm = {
    closingPrice: null,
    high: null,
    low: null,
    open: null,
    nominalValue: null,
    bookValue: null,
    eps: null,
    marketValue: null,
    peRatio: null,
    pbRatio: null,
    sharesOutstanding: null,
    earningsGrowthRate: null,
    epsGrowthRate: null,
    freeCashFlow: null,
    currency: 'EGP',
    sourceLastUpdateText: 'تعديل يدوي عبر لوحة الإدارة',
    recalculateRatios: true
  };

  // Shariah Manual Overrides
  shariahOverrides?: ShariahOverridesDto;
  shariahOverrideForm: SaveShariahOverridesRequest = {
    coreActivityCompliantOverride: null,
    categoryArOverride: null,
    categoryEnOverride: null,
    haramRevenuePercentageOverride: null,
    loansPercentageOverride: null
  };
  savingShariahOverrides = false;
  shariahOverridesError = '';
  shariahOverridesSuccess = '';

  // Bourse Halal Standards Preview — derived from SHARIAH_STANDARDS (single source of truth)
  bourseHalalStandards: Array<{
    name: string;
    revenueMax: number | null;
    debtMax: number;
    passes: boolean;
  }> = SHARIAH_STANDARDS.map(s => ({
    name: s.nameEn,
    revenueMax: s.prohibitedRevenueMax,
    debtMax: s.debtMax,
    passes: false
  }));

  /** Scholars standard labels and threshold exposed to the template. */
  readonly scholarsStandardNameAr = SCHOLARS_STANDARD_NAME_AR;
  readonly scholarsStandardNameEn = SCHOLARS_STANDARD_NAME_EN;
  readonly scholarsDebtMaxVal = scholarsDebtMax;

  // Shariah Manual Edit tab
  filteredShariahStocks: AdminStockLookupItem[] = [];
  shariahStockSearchQuery = '';
  shariahSelectedTicker = '';
  shariahSelectedStockMarketData?: MarketDataDto;
  shariahLoadingStock = false;

  // Upload tab
  selectedUploadIndex = '';
  uploadFile?: File;
  uploading = false;
  uploadResult?: UploadIndexFileResultDto;

  // Scraping tab
  scrapeStatus?: ScrapeStatusResponse;

  // Sector Daily Job panel state
  sectorDailyStatus: any = null;
  sectorDailyRecalculating = false;
  sectorDailyRangeRunning = false;
  sectorDailyMessage = '';
  sectorDailyIsError = false;
  rangeFromDate = '';
  rangeToDate = '';
  private pollInterval?: any;
  activeTriggerBucket?: 'LiveDaily' | 'SlowQuarterly';
  jobSettings: Record<string, boolean> = {
    LiveDaily: true,
    SlowQuarterly: true,
    ShariahRefresh: true,
    MarketSnapshots: true
  };
  jobSettingsLoading = false;
  togglingJobKey: string | null = null;
  jobToggleError: string | null = null;

  // Market Snapshots state
  isSnapshotsRunning = false;
  snapshotsRunResult?: RefreshMarketSnapshotsResult | null;
  snapshotsRunError: string | null = null;
  snapshotsLastRunText = 'لا يوجد سجل سابق';

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

  // Historical Sync modal & preview state
  showHistoricalModal = false;
  historicalSelectedFundId: number | null = null;
  historicalPreviewLoading = false;
  historicalCommitLoading = false;
  historicalPreview?: { totalFundsChecked: number; totalMissingCount: number; totalDifferentCount: number; funds: any[] } | null;
  historicalCommitResult?: { insertedCount: number; overwrittenCount: number; fundsUpdated: number; durationSeconds: number } | null;
  historicalError: string | null = null;
  overwriteDifferentChoice = false;

  // Comparison Chart Modal state
  showCompareChartModal = false;
  compareChartSelectedFundId: number | null = null;
  compareChartTimeframe = '1Y';
  compareChartLoading = false;
  compareChartData?: {
    fundId: number;
    fundCode: string;
    fundName: string;
    currency: string;
    timeframe: string;
    myPointsCount: number;
    sourcePointsCount: number;
    missingCount: number;
    differentCount: number;
    points: { date: string; myPrice: number | null; sourcePrice: number | null; isMissingInMine: boolean; isDifferent: boolean }[];
  } | null = null;
  compareChartInstance: any = null;
  adminFundPickerList: { id: number; code: string; nameAr: string; displayName?: string | null }[] = [];
  compareTimeframes = [
    { key: '1W', label: 'أسبوع' },
    { key: '1M', label: 'شهر' },
    { key: '3M', label: '3 شهور' },
    { key: '6M', label: '6 شهور' },
    { key: '1Y', label: 'سنة' },
    { key: 'ALL', label: 'الكل' }
  ];

  // Shariah tab
  shariahRefreshing = false;
  shariahSeeding = false;
  verdictRecomputing = false;
  backfillingActivity = false;
  recomputeResult?: { message?: string | null; recomputedCount: number; changedCount: number } | null;
  refreshResult?: RefreshShariahDataResult;
  seedResult?: SeedShariahResultDto;
  seedJsonOverride = '';

  // PDF Upload tab
  selectedPdfSource: 'FaisalBank' | 'Ostoul' = 'FaisalBank';
  pdfReportDate = '';
  selectedPdfFile?: File;
  pdfUploading = false;
  pdfUploadResult?: { success: boolean; message: string; fileName?: string; storedAt?: string; uploadedAt?: string; reportDate?: string };
  pdfUploadError = '';
  sourcePdfStatuses: Record<string, SourcePdfStatusDto> = {};
  sourcePdfLoading = false;
  sourcePdfError = '';

  // Review checklist tab
  removalCandidates: RemovalCandidateDto[] = [];
  selectedTickers = new Set<string>();
  candidatesLoading = false;
  candidatesBusy = false;
  candidatesMessage = '';
  candidatesError = false;
  refreshSelectedResult?: RefreshSelectedStocksResult;

  // Stocks management tab
  mgmtSearch = '';
  mgmtStocks: import('../../../shared/models/api.models').StockManagementItem[] = [];
  mgmtSectors: import('../../../shared/models/api.models').SectorPickerItem[] = [];
  mgmtIndices: import('../../../shared/models/api.models').IndexPickerItem[] = [];
  mgmtLoading = false;
  mgmtBusy = false;
  mgmtMessage = '';
  mgmtError = false;
  mgmtPickedSector: Record<number, number | undefined> = {};
  mgmtPickedIndex: Record<number, number | undefined> = {};
  showCreateStockModal = false;
  newStock: { ticker: string; nameAr: string; nameEn: string; sectorId: number | null } =
    { ticker: '', nameAr: '', nameEn: '', sectorId: null };

  constructor(
    private api: ApiService,
    private auth: AdminAuthService,
    private route: ActivatedRoute,
    private toast: ToastService,
    private cache: SessionCacheService
  ) {}

  ngOnInit(): void {
    // Each operations section is its own child route of the admin dashboard
    // shell; the route's `tab` data value selects the visible section so the
    // browser back/forward buttons work. Defaults to 'scraping' when no data.
    this.route.data.subscribe((data) => {
      const tab = data['tab'];
      if (
        tab === 'scraping' ||
        tab === 'market-data' ||
        tab === 'upload' ||
        tab === 'shariah' ||
        tab === 'pdf-upload' ||
        tab === 'review' ||
        tab === 'stocks' ||
        tab === 'shariah-edit'
      ) {
        this.activeTab = tab;
        if (tab === 'pdf-upload') {
          this.loadSourcePdfStatus();
        }
        if (tab === 'stocks') {
          this.loadMgmtData();
        }
        if (tab === 'scraping') {
          this.loadFundSyncSettings();
          this.loadFundSyncHistory();
          this.loadAdminFundPickerList();
        }
      }
    });
    this.loadIndices();
    this.loadStocks();
    this.fetchScrapeStatus();
    this.fetchFundSyncStatus();
    this.loadJobSettings();
    this.pollInterval = setInterval(() => {
      if (this.activeTab === 'scraping' || this.isAnyJobRunning) {
        this.fetchScrapeStatus();
        this.fetchFundSyncStatus();
      }
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadJobSettings(): void {
    this.jobSettingsLoading = true;
    this.api.getJobSettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.jobSettings = { ...this.jobSettings, ...settings };
        }
        this.jobSettingsLoading = false;
      },
      error: () => {
        this.jobSettingsLoading = false;
      }
    });
    this.loadSnapshotsLastRun();
  }

  loadSnapshotsLastRun(): void {
    this.api.getMarketSnapshots().subscribe({
      next: (snaps) => {
        if (snaps && snaps.length > 0) {
          const dates = snaps
            .map(s => s.fetchedAt ? new Date(s.fetchedAt).getTime() : 0)
            .filter(t => t > 0);
          if (dates.length > 0) {
            const maxDate = new Date(Math.max(...dates));
            this.snapshotsLastRunText = maxDate.toLocaleString('ar-EG');
          }
        }
      },
      error: () => {}
    });
  }

  toggleJobSetting(jobKey: string): void {
    const nextVal = !this.isJobEnabled(jobKey);
    this.togglingJobKey = jobKey;
    this.jobToggleError = null;
    this.api.setJobSetting(jobKey, nextVal).subscribe({
      next: (res) => {
        this.jobSettings = { ...this.jobSettings, [res.jobKey]: res.enabled };
        this.togglingJobKey = null;
      },
      error: (err) => {
        this.togglingJobKey = null;
        this.jobToggleError = `فشل حفظ إعداد المهمة (${jobKey}): ${err?.message || 'خطأ في الاتصال بالخادم'}`;
      }
    });
  }

  triggerSnapshotsRefresh(): void {
    if (this.isMarketSnapshotsRunning) return;
    this.isSnapshotsRunning = true;
    this.snapshotsRunResult = null;
    this.snapshotsRunError = null;
    this.fetchScrapeStatus();

    this.api.refreshMarketSnapshots().subscribe({
      next: (res) => {
        this.isSnapshotsRunning = false;
        this.snapshotsRunResult = res;
        this.snapshotsLastRunText = new Date().toLocaleString('ar-EG');
        this.fetchScrapeStatus();
      },
      error: (err) => {
        this.isSnapshotsRunning = false;
        this.fetchScrapeStatus();
        if (err?.status === 409) {
          this.snapshotsRunError = 'عملية سحب لقطات السوق قيد التشغيل بالفعل.';
        } else {
          this.snapshotsRunError = `فشل تشغيل سحب اللقطات: ${err?.error?.message || err?.message || 'خطأ غير متوقع'}`;
        }
      }
    });
  }

  isJobEnabled(jobKey: string): boolean {
    return this.jobSettings[jobKey] !== false;
  }

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

  // 1-b) Historical sync modal actions
  openHistoricalSyncModal(): void {
    this.showHistoricalModal = true;
    this.historicalError = null;
    this.historicalCommitResult = null;
    this.loadAdminFundPickerList();
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
        this.loadFundSyncHistory();
        this.fetchFundSyncStatus();
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

  // Comparison Chart Modal methods
  openCompareChartModal(fundId?: number): void {
    this.showCompareChartModal = true;
    this.loadAdminFundPickerList();
    if (fundId) {
      this.compareChartSelectedFundId = fundId;
    } else if (!this.compareChartSelectedFundId && this.adminFundPickerList.length > 0) {
      this.compareChartSelectedFundId = this.adminFundPickerList[0].id;
    }
    setTimeout(() => this.loadCompareChartData(), 50);
  }

  closeCompareChartModal(): void {
    this.showCompareChartModal = false;
    this.destroyCompareChart();
  }

  selectCompareTimeframe(tf: string): void {
    this.compareChartTimeframe = tf;
    this.loadCompareChartData();
  }

  openFundCompareFromPreview(fundId: number): void {
    this.closeHistoricalSyncModal();
    this.openCompareChartModal(fundId);
  }

  openHistoricalSyncForSelectedFund(): void {
    const fid = this.compareChartSelectedFundId;
    this.closeCompareChartModal();
    this.historicalSelectedFundId = fid;
    this.openHistoricalSyncModal();
  }

  loadCompareChartData(): void {
    if (!this.compareChartSelectedFundId) {
      if (this.adminFundPickerList.length > 0) {
        this.compareChartSelectedFundId = this.adminFundPickerList[0].id;
      } else {
        return;
      }
    }
    this.compareChartLoading = true;
    this.api.getFundCompareChart(this.compareChartSelectedFundId, this.compareChartTimeframe).subscribe({
      next: (data) => {
        this.compareChartData = data;
        this.compareChartLoading = false;
        setTimeout(() => this.renderCompareChart(), 50);
      },
      error: () => {
        this.compareChartLoading = false;
      }
    });
  }

  private async renderCompareChart(): Promise<void> {
    const canvas = document.getElementById('fundCompareCanvas') as HTMLCanvasElement | null;
    if (!canvas || !this.compareChartData) return;

    this.destroyCompareChart();

    let chartJsMod: any;
    try {
      chartJsMod = await import('chart.js');
      chartJsMod.Chart.register(...chartJsMod.registerables);
    } catch {
      return;
    }

    const data = this.compareChartData;
    const labels = data.points.map(p => p.date);
    const mySeries = data.points.map(p => p.myPrice);
    const sourceSeries = data.points.map(p => p.sourcePrice);

    // Highlight missing points in red, different in amber, normal transparent
    const pointColors = data.points.map(p => {
      if (p.isMissingInMine) return '#dc2626';
      if (p.isDifferent) return '#d97706';
      return '#2563eb';
    });

    const pointRadii = data.points.map(p => {
      if (p.isMissingInMine || p.isDifferent) return 5;
      return data.points.length > 100 ? 0 : 2;
    });

    this.compareChartInstance = new chartJsMod.Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Meezan (بياناتي)',
            data: mySeries,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.08)',
            borderWidth: 2,
            tension: 0.1,
            fill: false,
            spanGaps: true
          },
          {
            label: 'SNDUK (المصدر)',
            data: sourceSeries,
            borderColor: '#2563eb',
            borderDash: [4, 4],
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
            pointRadius: pointRadii,
            tension: 0.1,
            fill: false,
            spanGaps: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, position: 'top', rtl: true },
          tooltip: {
            rtl: true,
            callbacks: {
              afterBody: (items: any[]) => {
                const idx = items[0]?.dataIndex;
                if (idx != null && data.points[idx]) {
                  const pt = data.points[idx];
                  if (pt.isMissingInMine) return '⚠️ نقطة ناقصة في Meezan';
                  if (pt.isDifferent) return '⚡ نقطة مختلفة القيمة بين المصدر وبياناتي';
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            ticks: {
              callback: (val: any) => `${val} ${data.currency || 'ج.م'}`
            }
          }
        }
      }
    });
  }

  private destroyCompareChart(): void {
    if (this.compareChartInstance) {
      this.compareChartInstance.destroy();
      this.compareChartInstance = null;
    }
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

  logout(): void {
    this.auth.logout();
  }

  get isDailyRunning(): boolean {
    const job = this.scrapeStatus?.jobs?.['LiveDaily'];
    if (job) return job.status === 'Running' || job.status === 'Committing';
    return (this.scrapeStatus?.status === 'Running' || this.scrapeStatus?.status === 'Committing') &&
      (this.activeTriggerBucket === 'LiveDaily' || (this.scrapeStatus?.live?.jobKey === 'LiveDaily') || (this.scrapeStatus?.live?.triggeredBy?.includes('Live') ?? false));
  }

  get isQuarterlyRunning(): boolean {
    const job = this.scrapeStatus?.jobs?.['SlowQuarterly'];
    if (job) return job.status === 'Running' || job.status === 'Committing';
    return (this.scrapeStatus?.status === 'Running' || this.scrapeStatus?.status === 'Committing') &&
      (this.activeTriggerBucket === 'SlowQuarterly' || (this.scrapeStatus?.live?.jobKey === 'SlowQuarterly') || (this.scrapeStatus?.live?.triggeredBy?.includes('Slow') ?? false));
  }

  get isMarketSnapshotsRunning(): boolean {
    const job = this.scrapeStatus?.jobs?.['MarketSnapshots'];
    if (job) return job.status === 'Running' || job.status === 'Committing';
    return this.isSnapshotsRunning;
  }

  get isFundSyncRunning(): boolean {
    return this.fundSyncRunning || this.fundPriceSyncRunning || (this.fundSyncStatus?.isRunning ?? false);
  }

  get isScrapingRunning(): boolean {
    return this.isDailyRunning || this.isQuarterlyRunning;
  }

  get isAnyJobRunning(): boolean {
    return this.isDailyRunning || this.isQuarterlyRunning || this.isMarketSnapshotsRunning || this.isFundSyncRunning;
  }

  get runningJobs(): { jobKey: string; nameAr: string; nameEn: string; status: string; live?: LiveProgressInfo | null }[] {
    const list: { jobKey: string; nameAr: string; nameEn: string; status: string; live?: LiveProgressInfo | null }[] = [];
    if (!this.scrapeStatus) return list;

    if (this.scrapeStatus.jobs) {
      for (const [key, job] of Object.entries(this.scrapeStatus.jobs)) {
        if (job.status === 'Running' || job.status === 'Committing') {
          list.push({
            jobKey: key,
            nameAr: this.getJobNameAr(key),
            nameEn: key,
            status: job.status,
            live: job.live
          });
        }
      }
    }

    if (list.length === 0 && (this.scrapeStatus.status === 'Running' || this.scrapeStatus.status === 'Committing')) {
      const key = this.scrapeStatus.live?.jobKey || this.activeTriggerBucket || (this.isSnapshotsRunning ? 'MarketSnapshots' : 'LiveDaily');
      list.push({
        jobKey: key,
        nameAr: this.getJobNameAr(key),
        nameEn: key,
        status: this.scrapeStatus.status,
        live: this.scrapeStatus.live
      });
    }

    return list;
  }

  get recentlyFinishedJobs(): { jobKey: string; nameAr: string; nameEn: string; status: string; live?: LiveProgressInfo | null }[] {
    const list: { jobKey: string; nameAr: string; nameEn: string; status: string; live?: LiveProgressInfo | null }[] = [];
    if (!this.scrapeStatus?.jobs) {
      if (this.scrapeStatus?.status === 'Completed' || this.scrapeStatus?.status === 'Failed') {
        const key = this.scrapeStatus.live?.jobKey || 'LiveDaily';
        list.push({
          jobKey: key,
          nameAr: this.getJobNameAr(key),
          nameEn: key,
          status: this.scrapeStatus.status,
          live: this.scrapeStatus.live
        });
      }
      return list;
    }

    for (const [key, job] of Object.entries(this.scrapeStatus.jobs)) {
      if (job.status === 'Completed' || job.status === 'Failed') {
        list.push({
          jobKey: key,
          nameAr: this.getJobNameAr(key),
          nameEn: key,
          status: job.status,
          live: job.live
        });
      }
    }
    return list;
  }

  getJobNameAr(jobKey: string): string {
    switch (jobKey) {
      case 'LiveDaily': return 'سحب الأسعار المباشرة (Daily Live-Price)';
      case 'SlowQuarterly': return 'سحب الأساسيات الربع سنوية (Quarterly Slow)';
      case 'MarketSnapshots': return 'لقطات السوق والمؤشرات (Market Snapshots)';
      default: return jobKey;
    }
  }

  getJobStatusLabel(status: string): string {
    switch (status) {
      case 'Running': return 'جاري التشغيل';
      case 'Committing': return 'جاري حفظ البيانات';
      case 'Completed': return 'اكتمل بنجاح';
      case 'Failed': return 'فشل';
      case 'NotRunning': return 'متوقف';
      default: return status || 'متوقف';
    }
  }

  getBucketLastRun(bucket: 'LiveDaily' | 'SlowQuarterly'): string {
    if (!this.scrapeStatus?.lastRun) return 'لا يوجد سجل سابق';
    const last = this.scrapeStatus.lastRun;
    if (bucket === 'LiveDaily' && last.triggeredBy.includes('Live')) {
      return `${new Date(last.runAt).toLocaleString('ar-EG')}`;
    }
    if (bucket === 'SlowQuarterly' && last.triggeredBy.includes('Slow')) {
      return `${new Date(last.runAt).toLocaleString('ar-EG')}`;
    }
    return `${new Date(last.runAt).toLocaleString('ar-EG')} (${last.triggeredBy})`;
  }

  loadIndices(): void {
    this.api.getIndices().subscribe({
      next: (data) => (this.indices = data || [])
    });
  }

  loadStocks(): void {
    this.api.getAdminStocksLookup().subscribe({
      next: (stocks) => {
        this.allStocks = stocks || [];
        this.filteredStocks = [...this.allStocks];
      },
      error: () => {
        // Fallback: load all via paginated endpoint with large page size
        this.api.getStocks({ page: 1, pageSize: 500 }).subscribe({
          next: (res) => {
            this.allStocks = (res.items || []).map(s => ({
              ticker: s.ticker,
              nameAr: s.nameAr,
              nameEn: s.nameEn
            }));
            this.filteredStocks = [...this.allStocks];
          }
        });
      }
    });
  }

  onSearchInput(): void {
    const q = this.stockSearchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredStocks = [...this.allStocks];
      return;
    }
    this.filteredStocks = this.allStocks.filter(s =>
      s.ticker.toLowerCase().includes(q) ||
      (s.nameAr && s.nameAr.toLowerCase().includes(q)) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q))
    );

    // If exact ticker match typed, auto-select
    const exact = this.allStocks.find(s => s.ticker.toLowerCase() === q);
    if (exact && this.selectedTicker !== exact.ticker) {
      this.selectedTicker = exact.ticker;
      this.loadStockMarketData(exact.ticker);
    }
  }

  selectStockDirectly(ticker: string): void {
    this.selectedTicker = ticker;
    this.stockSearchQuery = ticker;
    this.loadStockMarketData(ticker);
  }

  onStockSelected(): void {
    if (!this.selectedTicker) {
      this.selectedStockMarketData = undefined;
      return;
    }
    this.stockSearchQuery = this.selectedTicker;
    this.loadStockMarketData(this.selectedTicker);
  }

  loadStockMarketData(ticker: string): void {
    this.loadingStock = true;
    this.saveError = '';
    this.saveSuccessResult = undefined;

    this.api.getMarketData(ticker).subscribe({
      next: (data) => {
        this.selectedStockMarketData = data;
        this.populateForm(data);
        this.loadingStock = false;
      },
      error: (err) => {
        if (err.status === 404) {
          // Stock exists but has no market data yet — show empty form for creation
          const match = this.allStocks.find(s => s.ticker === ticker);
          this.selectedStockMarketData = {
            ticker,
            nameAr: match?.nameAr,
            nameEn: match?.nameEn,
            indices: [],
            shariahOpinions: [],
          } as any;
          this.marketForm = {
            closingPrice: null, high: null, low: null, open: null,
            nominalValue: null, bookValue: null, eps: null, marketValue: null,
            peRatio: null, pbRatio: null,
            sharesOutstanding: null, earningsGrowthRate: null, epsGrowthRate: null, freeCashFlow: null,
            currency: 'EGP',
            sourceLastUpdateText: 'تعديل يدوي من لوحة الإدارة',
            recalculateRatios: true
          };
          this.saveError = '';
        } else {
          this.saveError = 'تعذر تحميل بيانات السهم المختار';
        }
        this.loadingStock = false;
      }
    });
  }

  loadShariahOverrides(ticker: string): void {
    this.api.getShariahOverrides(ticker).subscribe({
      next: (data) => {
        this.shariahOverrides = data;
        this.populateShariahOverrideForm(data);
        this.updateBourseHalalStandards();
      },
      error: () => {
        // Shariah overrides not found or not applicable - silently continue
        this.shariahOverrides = undefined;
      }
    });
  }

  populateShariahOverrideForm(data: ShariahOverridesDto): void {
    this.shariahOverrideForm = {
      coreActivityCompliantOverride: data.overrideCoreActivityCompliant ?? null,
      categoryArOverride: data.overrideCategoryAr ?? null,
      categoryEnOverride: data.overrideCategoryEn ?? null,
      haramRevenuePercentageOverride: data.overrideHaramRevenuePercentage ?? null,
      loansPercentageOverride: data.overrideLoansPercentage ?? null
    };
    
    // Set the checkbox to show the effective value initially
    // The checkbox will write to the override field when toggled
    this._coreActivityCheckboxValue = data.effectiveCoreActivityCompliant ?? false;
  }

  // Helper for the checkbox: shows effective value, writes override on change
  private _coreActivityCheckboxValue = false;
  get coreActivityCheckboxValue(): boolean {
    return this._coreActivityCheckboxValue;
  }
  set coreActivityCheckboxValue(val: boolean) {
    this._coreActivityCheckboxValue = val;
    // When user toggles, write to the override field
    this.shariahOverrideForm.coreActivityCompliantOverride = val;
  }

  adminEvaluation?: ReturnType<typeof evaluateStandards>;
  adminIsViaScholarsOnly = false;
  adminOverallVerdict: string | null = null;

  updateBourseHalalStandards(): void {
    if (!this.shariahOverrides) return;
    const rev = this.shariahOverrides.effectiveHaramRevenuePercentage ?? null;
    const debt = this.shariahOverrides.effectiveLoansPercentage ?? null;
    this.adminEvaluation = evaluateStandards({
      prohibitedRevenue: rev,
      debt: debt
    });
    this.bourseHalalStandards = this.adminEvaluation.standards.map(s => ({
      name: s.standard.nameEn,
      revenueMax: s.standard.prohibitedRevenueMax,
      debtMax: s.standard.debtMax,
      passes: s.passed
    }));
    this.adminIsViaScholarsOnly = isViaScholarsOnly(this.adminEvaluation, debt);
    this.adminOverallVerdict = resolveVerdictWithScholars(this.adminEvaluation, debt);
  }

  // ── Shariah Manual Edit tab ────────────────────────────────────────────────

  onShariahSearchInput(): void {
    const q = this.shariahStockSearchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredShariahStocks = [...this.allStocks];
      return;
    }
    this.filteredShariahStocks = this.allStocks.filter(s =>
      s.ticker.toLowerCase().includes(q) ||
      (s.nameAr && s.nameAr.toLowerCase().includes(q)) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q))
    );

    // If exact ticker match typed, auto-select
    const exact = this.allStocks.find(s => s.ticker.toLowerCase() === q);
    if (exact && this.shariahSelectedTicker !== exact.ticker) {
      this.shariahSelectedTicker = exact.ticker;
      this.loadShariahStockMarketData(exact.ticker);
    }
  }

  selectShariahStockDirectly(ticker: string): void {
    this.shariahSelectedTicker = ticker;
    this.shariahStockSearchQuery = ticker;
    this.loadShariahStockMarketData(ticker);
  }

  onShariahStockSelected(): void {
    if (!this.shariahSelectedTicker) {
      this.shariahSelectedStockMarketData = undefined;
      return;
    }
    this.shariahStockSearchQuery = this.shariahSelectedTicker;
    this.loadShariahStockMarketData(this.shariahSelectedTicker);
  }

  loadShariahStockMarketData(ticker: string): void {
    this.shariahLoadingStock = true;
    this.shariahOverrides = undefined;
    this.shariahOverridesError = '';
    this.shariahOverridesSuccess = '';

    this.api.getMarketData(ticker).subscribe({
      next: (data) => {
        this.shariahSelectedStockMarketData = data;
        this.shariahLoadingStock = false;
        this.loadShariahOverrides(ticker);
      },
      error: (err) => {
        if (err.status === 404) {
          const match = this.allStocks.find(s => s.ticker === ticker);
          this.shariahSelectedStockMarketData = {
            ticker,
            nameAr: match?.nameAr,
            nameEn: match?.nameEn,
            indices: [],
            shariahOpinions: [],
          } as any;
        } else {
          this.shariahOverridesError = 'تعذر تحميل بيانات السهم المختار';
        }
        this.shariahLoadingStock = false;
      }
    });
  }

  populateForm(data: MarketDataDto): void {
    this.marketForm = {
      closingPrice: data.closingPrice ?? null,
      high: data.high ?? null,
      low: data.low ?? null,
      open: data.open ?? null,
      nominalValue: data.nominalValue ?? null,
      bookValue: data.bookValue ?? null,
      eps: data.eps ?? null,
      marketValue: data.marketValue ?? null,
      peRatio: data.peRatio ?? null,
      pbRatio: data.pbRatio ?? null,
      sharesOutstanding: data.sharesOutstanding ?? null,
      earningsGrowthRate: data.earningsGrowthRate ?? null,
      epsGrowthRate: data.epsGrowthRate ?? null,
      freeCashFlow: data.freeCashFlow ?? null,
      currency: data.currency || 'EGP',
      sourceLastUpdateText: 'تعديل يدوي من لوحة الإدارة',
      recalculateRatios: true
    };
  }

  resetMarketForm(): void {
    if (this.selectedStockMarketData) {
      this.populateForm(this.selectedStockMarketData);
      this.saveError = '';
      this.saveSuccessResult = undefined;
    }
  }

  saveMarketData(event: Event): void {
    event.preventDefault();
    if (!this.selectedStockMarketData || !this.selectedTicker) return;

    if (this.marketForm.closingPrice !== null && this.marketForm.closingPrice < 0) {
      this.saveError = 'لا يمكن أن يكون سعر الإغلاق رقماً سالباً.';
      return;
    }

    const confirmMsg = `هل أنت متأكد من حفظ التعديلات اليدوية للسهم ${this.selectedTicker}؟ سيتم تحديث القيم الحية وتجاوز أي قيم مسحوبة آلياً.`;
    if (!confirm(confirmMsg)) {
      return;
    }

    this.savingMarketData = true;
    this.saveError = '';
    this.saveSuccessResult = undefined;

    const req: ManualMarketDataUpdateRequest = {
      nominalValue: this.marketForm.nominalValue,
      marketValue: this.marketForm.marketValue,
      bookValue: this.marketForm.bookValue,
      eps: this.marketForm.eps,
      peRatio: this.marketForm.peRatio,
      pbRatio: this.marketForm.pbRatio,
      sharesOutstanding: this.marketForm.sharesOutstanding,
      earningsGrowthRate: this.marketForm.earningsGrowthRate,
      epsGrowthRate: this.marketForm.epsGrowthRate,
      freeCashFlow: this.marketForm.freeCashFlow,
      currency: this.marketForm.currency,
      high: this.marketForm.high,
      low: this.marketForm.low,
      open: this.marketForm.open,
      closingPrice: this.marketForm.closingPrice,
      sourceLastUpdateText: this.marketForm.sourceLastUpdateText,
      recalculateRatios: this.marketForm.recalculateRatios
    };

    this.api.updateMarketData(this.selectedTicker, req).subscribe({
      next: (res) => {
        this.saveSuccessResult = res;
        this.savingMarketData = false;
        // Refresh stock market data view
        this.loadStockMarketData(this.selectedTicker);
      },
      error: (err) => {
        this.saveError = err.error?.message || err.message || 'حدث خطأ أثناء حفظ بيانات السوق.';
        this.savingMarketData = false;
      }
    });
  }

  // ── Shariah Manual Overrides ────────────────────────────────────────────────

  saveShariahOverrides(): void {
    if (!this.shariahSelectedTicker) return;

    // Validate percentage ranges
    const haramRev = this.shariahOverrideForm.haramRevenuePercentageOverride;
    if (haramRev !== null && haramRev !== undefined &&
        (haramRev < 0 || haramRev > 100)) {
      this.shariahOverridesError = 'نسبة الإيراد المحرم يجب أن تكون بين 0 و 100.';
      return;
    }
    const loansPct = this.shariahOverrideForm.loansPercentageOverride;
    if (loansPct !== null && loansPct !== undefined &&
        (loansPct < 0 || loansPct > 100)) {
      this.shariahOverridesError = 'نسبة القروض والفوائد يجب أن تكون بين 0 و 100.';
      return;
    }

    this.savingShariahOverrides = true;
    this.shariahOverridesError = '';
    this.shariahOverridesSuccess = '';

    const ticker = this.shariahSelectedTicker;
    this.api.saveShariahOverrides(ticker, this.shariahOverrideForm).subscribe({
      next: (data) => {
        this.shariahOverrides = data;
        this.populateShariahOverrideForm(data);
        this.updateBourseHalalStandards();
        this.shariahOverridesSuccess = 'تم حفظ التعديلات الشرعية بنجاح. تم إعادة احتساب حالة الامتثال.';
        this.savingShariahOverrides = false;
        // Refresh the stock market data to reflect updated compliance status
        this.loadShariahStockMarketData(ticker);
      },
      error: (err) => {
        // Clean Arabic error: prefer server-provided message, fallback to generic
        const serverMsg = err.error?.message || err.error?.title || '';
        this.shariahOverridesError = serverMsg
          ? `فشل الحفظ: ${serverMsg}`
          : 'حدث خطأ أثناء حفظ التعديلات الشرعية. يرجى المحاولة مرة أخرى.';
        this.savingShariahOverrides = false;
      }
    });
  }

  resetShariahOverride(fieldName: string): void {
    if (!this.shariahSelectedTicker) return;

    const confirmMsg = `هل أنت متأكد من استعادة قيمة التغذية لـ ${this.getFieldLabel(fieldName)}؟ سيتم إلغاء التعديل اليدوي.`;
    if (!confirm(confirmMsg)) {
      return;
    }

    this.savingShariahOverrides = true;
    this.shariahOverridesError = '';
    this.shariahOverridesSuccess = '';

    const ticker = this.shariahSelectedTicker;
    this.api.resetShariahOverride(ticker, fieldName).subscribe({
      next: (data) => {
        this.shariahOverrides = data;
        this.populateShariahOverrideForm(data);
        this.updateBourseHalalStandards();
        this.shariahOverridesSuccess = `تم استعادة قيمة التغذية لـ ${this.getFieldLabel(fieldName)}.`;
        this.savingShariahOverrides = false;
        // Refresh the stock market data to reflect updated compliance status
        this.loadShariahStockMarketData(ticker);
      },
      error: (err) => {
        // Clean Arabic error: prefer server-provided message, fallback to generic
        const serverMsg = err.error?.message || err.error?.title || '';
        this.shariahOverridesError = serverMsg
          ? `فشل الاستعادة: ${serverMsg}`
          : 'حدث خطأ أثناء استعادة قيمة التغذية. يرجى المحاولة مرة أخرى.';
        this.savingShariahOverrides = false;
      }
    });
  }

  private getFieldLabel(fieldName: string): string {
    switch (fieldName.toLowerCase()) {
      case 'coreactivitycompliant': return 'مطابقة النشاط الأساسي';
      case 'categoryar': return 'التصنيف (العربي)';
      case 'categoryen': return 'التصنيف (الإنجليزي)';
      case 'haramrevenuepercentage': return 'نسبة الإيراد المحرم';
      case 'loanspercentage': return 'نسبة القروض والفوائد';
      default: return fieldName;
    }
  }

  get passedStandardsCount(): number {
    return this.bourseHalalStandards?.filter(s => s.passes).length ?? 0;
  }

  triggerDailyScrape(): void {
    this.activeTriggerBucket = 'LiveDaily';
    this.toast.show('بدأ السحب اليومي المباشر...');
    this.api.runScraping('LiveDaily').subscribe({
      next: () => {
        this.fetchScrapeStatus();
      },
      error: (err) => {
        console.error('Failed to trigger daily scrape', err);
        this.activeTriggerBucket = undefined;
        this.toast.show('فشل تشغيل السحب اليومي: ' + (err.error?.message || err.message || 'خطأ غير متوقع'));
      }
    });
  }

  triggerQuarterlyScrape(): void {
    this.activeTriggerBucket = 'SlowQuarterly';
    this.toast.show('بدأ سحب الأساسيات الربع سنوية...');
    this.api.runScraping('SlowQuarterly').subscribe({
      next: () => {
        this.fetchScrapeStatus();
      },
      error: (err) => {
        console.error('Failed to trigger quarterly scrape', err);
        this.activeTriggerBucket = undefined;
        this.toast.show('فشل تشغيل السحب الربع سنوي: ' + (err.error?.message || err.message || 'خطأ غير متوقع'));
      }
    });
  }

  fetchScrapeStatus(): void {
    this.api.getScrapingStatus().subscribe({
      next: (res) => {
        this.scrapeStatus = res;
        if (!this.isScrapingRunning) {
          this.activeTriggerBucket = undefined;
        }
      }
    });
    this.fetchSectorDailyStatus();
  }

  fetchSectorDailyStatus(): void {
    this.api.getSectorDailyStatus().subscribe({
      next: (data) => {
        this.sectorDailyStatus = data;
      },
      error: () => { }
    });
  }

  recalculateSectorDailyToday(): void {
    this.sectorDailyRecalculating = true;
    this.sectorDailyMessage = '';
    this.sectorDailyIsError = false;
    this.api.recalculateSectorDailyToday().subscribe({
      next: (res) => {
        this.sectorDailyRecalculating = false;
        this.sectorDailyMessage = `تمت إعادة حساب اليوم بنجاح لـ ${res.count || 0} قطاعاً (جلسة: ${res.tradingDate}).`;
        this.fetchSectorDailyStatus();
      },
      error: (err) => {
        this.sectorDailyRecalculating = false;
        this.sectorDailyIsError = true;
        this.sectorDailyMessage = 'فشلت إعادة حساب القطاعات: ' + (err.error?.message || err.message || 'خطأ غير معروف');
      }
    });
  }

  recomputeSectorDailyRange(): void {
    if (!this.rangeFromDate || !this.rangeToDate) {
      this.sectorDailyIsError = true;
      this.sectorDailyMessage = 'يرجى تحديد تاريخ البداية والنهاية.';
      return;
    }
    this.sectorDailyRangeRunning = true;
    this.sectorDailyMessage = '';
    this.sectorDailyIsError = false;
    this.api.recomputeSectorDailyRange(this.rangeFromDate, this.rangeToDate).subscribe({
      next: (res) => {
        this.sectorDailyRangeRunning = false;
        this.sectorDailyMessage = `تمت إعادة حساب الفترة بنجاح (${res.rowsRecomputed} سجل تم تحديثه عبر ${res.daysProcessed} يوماً).`;
        this.fetchSectorDailyStatus();
      },
      error: (err) => {
        this.sectorDailyRangeRunning = false;
        this.sectorDailyIsError = true;
        this.sectorDailyMessage = 'فشلت إعادة حساب الفترة: ' + (err.error?.message || err.message || 'خطأ غير معروف');
      }
    });
  }

  getSectorName(sectorId: number): string {
    const sec = this.mgmtSectors?.find((s: any) => s.id === sectorId);
    return sec?.nameAr || `قطاع #${sectorId}`;
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.uploadFile = file;
    }
  }

  onUploadSubmit(event: Event): void {
    event.preventDefault();
    if (!this.selectedUploadIndex || !this.uploadFile) return;

    this.uploading = true;
    this.uploadResult = undefined;

    this.api.uploadIndexFile(this.selectedUploadIndex, this.uploadFile).subscribe({
      next: (res) => {
        this.uploadResult = res;
        this.uploading = false;
        this.loadIndices();
      },
      error: (err) => {
        this.uploadResult = {
          indexCode: this.selectedUploadIndex,
          inserted: 0,
          updated: 0,
          skipped: 0,
          totalConstituents: 0,
          skippedDetails: [],
          status: 'Failed',
          message: err.error?.message || err.message || 'حدث خطأ أثناء معالجة ملف الإكسيل.'
        };
        this.uploading = false;
      }
    });
  }

  triggerVerdictRecompute(): void {
    this.verdictRecomputing = true;
    this.recomputeResult = null;
    this.api.recomputeVerdicts().subscribe({
      next: (res) => {
        this.recomputeResult = res;
        this.verdictRecomputing = false;
        // Also run the core activity backfill as part of recompute
        this.api.backfillCoreActivityCompliant().subscribe({
          next: (backfillRes) => {
            console.log('CoreActivity backfill:', backfillRes.message);
          },
          error: () => {
            // Silent fail for backfill
          }
        });
      },
      error: (err) => {
        this.recomputeResult = { message: err.error?.message || err.message || 'فشل إعادة الحساب', recomputedCount: 0, changedCount: 0 };
        this.verdictRecomputing = false;
      }
    });
  }

  triggerShariahRefresh(): void {
    this.shariahRefreshing = true;
    this.refreshResult = undefined;
    this.api.refreshShariah().subscribe({
      next: (res) => {
        this.refreshResult = res;
        this.shariahRefreshing = false;
      },
      error: () => {
        this.shariahRefreshing = false;
      }
    });
  }

  triggerShariahSeed(): void {
    this.shariahSeeding = true;
    this.seedResult = undefined;
    let payload: any = null;
    if (this.seedJsonOverride.trim()) {
      try {
        payload = JSON.parse(this.seedJsonOverride);
      } catch (e) {
        alert('صيغة JSON غير صحيحة');
        this.shariahSeeding = false;
        return;
      }
    }

    this.api.seedShariah(payload).subscribe({
      next: (res) => {
        this.seedResult = res;
        this.shariahSeeding = false;
      },
      error: () => {
        this.shariahSeeding = false;
      }
    });
  }

  backfillCoreActivityCompliant(): void {
    this.backfillingActivity = true;
    this.api.backfillCoreActivityCompliant().subscribe({
      next: (res) => {
        this.backfillingActivity = false;
        alert(res.message);
        // Refresh the shariah tab if we're on it
        if (this.activeTab === 'shariah-edit' && this.shariahSelectedTicker) {
          this.loadShariahOverrides(this.shariahSelectedTicker);
        }
      },
      error: (err) => {
        this.backfillingActivity = false;
        alert('فشل تنفيذ البذر: ' + (err.error?.message || err.message || 'خطأ غير متوقع'));
      }
    });
  }

  // ── PDF Upload tab ────────────────────────────────────────────────
  onPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('الملف يجب أن يكون بصيغة PDF');
        this.selectedPdfFile = undefined;
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('حجم الملف يتجاوز 50 ميجابايت');
        this.selectedPdfFile = undefined;
        return;
      }
      this.selectedPdfFile = file;
      this.pdfUploadError = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' بايت';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' كيلوبايت';
    return (bytes / (1024 * 1024)).toFixed(1) + ' ميجابايت';
  }

  uploadPdfReport(): void {
    if (!this.selectedPdfFile) {
      this.pdfUploadError = 'الرجاء اختيار ملف PDF أولاً';
      return;
    }

    this.pdfUploading = true;
    this.pdfUploadError = '';
    this.pdfUploadResult = undefined;

    this.api.uploadSourcePdf(this.selectedPdfSource, this.selectedPdfFile, this.pdfReportDate || undefined).subscribe({
      next: (data) => {
        if (data.success) {
          this.pdfUploadResult = {
            success: true,
            message: data.message || '',
            fileName: data.fileName || undefined,
            storedAt: data.storedAt || undefined,
            uploadedAt: data.uploadedAt || undefined,
            reportDate: data.reportDate || undefined
          };
          this.pdfUploadError = '';
          this.selectedPdfFile = undefined;
          // Refresh stored-files status immediately (no stale cache).
          this.loadSourcePdfStatus();
        } else {
          this.pdfUploadError = data.message || 'فشل رفع الملف';
          this.pdfUploadResult = {
            success: false,
            message: data.message || 'فشل رفع الملف'
          };
        }
        this.pdfUploading = false;
      },
      error: (e) => {
        this.pdfUploadError = 'خطأ في الاتصال بالخادم: ' + (e?.message || e);
        this.pdfUploadResult = {
          success: false,
          message: 'خطأ في الاتصال بالخادم'
        };
        this.pdfUploading = false;
      }
    });
  }

  /**
   * Loads the stored-files status from the API (database record + file on
   * disk, per source). Never defaults to "not found": loading and error states
   * are surfaced explicitly in the template.
   */
  loadSourcePdfStatus(): void {
    this.sourcePdfLoading = true;
    this.sourcePdfError = '';
    this.api.getSourcePdfStatus().subscribe({
      next: (rows) => {
        const map: Record<string, SourcePdfStatusDto> = {};
        for (const row of rows || []) {
          if (row?.sourceKey) map[row.sourceKey] = row;
        }
        this.sourcePdfStatuses = map;
        this.sourcePdfLoading = false;
      },
      error: () => {
        this.sourcePdfLoading = false;
        this.sourcePdfError = 'تعذّر تحميل حالة الملفات المخزنة.';
      }
    });
  }

  getSourcePdfState(sourceKey: string): SourcePdfStatusDto | null {
    return this.sourcePdfStatuses[sourceKey] ?? null;
  }

  getSourcePdfViewUrl(sourceKey: string): string {
    return this.api.getSourcePdfUrl(sourceKey);
  }

  formatPdfDate(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  }

  // ── Review checklist tab ───────────────────────────────────────────
  openReviewTab(): void {
    this.activeTab = 'review';
    if (this.removalCandidates.length === 0) this.loadRemovalCandidates();
  }

  loadRemovalCandidates(): void {
    this.candidatesLoading = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.api.getRemovalCandidates().subscribe({
      next: (rows) => {
        this.removalCandidates = rows || [];
        // Drop selections for tickers that are no longer candidates.
        this.selectedTickers = new Set(
          [...this.selectedTickers].filter((t) => this.removalCandidates.some((c) => c.ticker === t))
        );
        this.candidatesLoading = false;
      },
      error: () => {
        this.candidatesLoading = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر تحميل قائمة المراجعة.';
      }
    });
  }

  toggleCandidate(ticker: string, checked: boolean): void {
    if (checked) this.selectedTickers.add(ticker);
    else this.selectedTickers.delete(ticker);
    this.selectedTickers = new Set(this.selectedTickers);
  }

  get allCandidatesSelected(): boolean {
    return this.removalCandidates.length > 0 && this.selectedTickers.size === this.removalCandidates.length;
  }

  toggleSelectAllCandidates(checked: boolean): void {
    this.selectedTickers = checked
      ? new Set(this.removalCandidates.map((c) => c.ticker))
      : new Set<string>();
  }

  refreshSelectedCandidates(): void {
    const tickers = [...this.selectedTickers];
    if (!tickers.length) return;
    this.candidatesBusy = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.refreshSelectedResult = undefined;
    this.api.refreshSelectedStocks(tickers).subscribe({
      next: (res) => {
        this.candidatesBusy = false;
        this.refreshSelectedResult = res;
        this.candidatesError = !res.success;
        this.candidatesMessage = `اكتملت إعادة السحب: نجح ${res.succeeded} وفشل ${res.failed} من ${res.totalRequested}.`
          + (res.errorSummary ? ` — ${res.errorSummary}` : '');
        this.loadRemovalCandidates();
      },
      error: () => {
        this.candidatesBusy = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر تنفيذ إعادة السحب للأسهم المحددة.';
      }
    });
  }

  confirmSelectedCandidates(): void {
    const tickers = [...this.selectedTickers];
    if (!tickers.length) return;
    if (!confirm(`تأكيد إيقاف ${tickers.length} سهم؟ (يتم الإيقاف فقط مع الاحتفاظ بالبيانات)`)) return;
    this.candidatesBusy = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.api.confirmRemovals(tickers, 'تم الإيقاف يدوياً عبر قائمة المراجعة').subscribe({
      next: (res) => {
        this.candidatesBusy = false;
        this.candidatesMessage = res.message;
        this.selectedTickers = new Set<string>();
        this.loadRemovalCandidates();
      },
      error: () => {
        this.candidatesBusy = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر تأكيد الإيقاف.';
      }
    });
  }

  reactivateSelectedCandidates(): void {
    const tickers = [...this.selectedTickers];
    if (!tickers.length) return;
    this.candidatesBusy = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.api.reactivateSelectedStocks(tickers).subscribe({
      next: (res) => {
        this.candidatesBusy = false;
        this.candidatesMessage = res.message;
        this.selectedTickers = new Set<string>();
        this.loadRemovalCandidates();
      },
      error: () => {
        this.candidatesBusy = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر إعادة التفعيل.';
      }
    });
  }

  reasonLabel(reason: string): string {
    switch (reason) {
      case 'StaleData': return 'بيانات قديمة';
      case 'NotFoundOnSource': return 'غير موجود في المصدر';
      case 'Deactivated': return 'معطَّل يدوياً';
      default: return reason;
    }
  }

  // ── Stocks management ──────────────────────────────
  loadMgmtData(): void {
    this.mgmtLoading = true;
    this.mgmtMessage = '';
    this.api.getManagementSectors().subscribe({
      next: (s) => (this.mgmtSectors = s || []),
      error: () => {}
    });
    this.api.getManagementIndices().subscribe({
      next: (i) => (this.mgmtIndices = i || []),
      error: () => {}
    });
    this.api.searchStocksForManagement(this.mgmtSearch ? this.mgmtSearch.trim() : undefined).subscribe({
      next: (stocks) => {
        this.mgmtStocks = stocks || [];
        this.mgmtLoading = false;
      },
      error: () => {
        this.mgmtLoading = false;
        this.mgmtError = true;
        this.mgmtMessage = 'تعذّر تحميل الأسهم.';
      }
    });
  }

  onMgmtSearchChange(q: string): void {
    this.mgmtSearch = q;
    this.loadMgmtData();
  }

  createStock(): void {
    if (!this.newStock.ticker.trim()) {
      this.mgmtError = true;
      this.mgmtMessage = 'يرجى إدخال رمز السهم (Ticker).';
      return;
    }
    this.mgmtBusy = true;
    this.mgmtMessage = '';
    this.api.createManagedStock({
      ticker: this.newStock.ticker.trim(),
      nameAr: this.newStock.nameAr?.trim() || null,
      nameEn: this.newStock.nameEn?.trim() || null,
      sectorId: this.newStock.sectorId
    }).subscribe({
      next: (s) => {
        this.mgmtBusy = false;
        this.mgmtError = false;
        this.mgmtMessage = `تم إنشاء سهم ${s.ticker} بنجاح.`;
        this.showCreateStockModal = false;
        this.newStock = { ticker: '', nameAr: '', nameEn: '', sectorId: null };
        this.loadMgmtData();
      },
      error: (e) => {
        this.mgmtBusy = false;
        this.mgmtError = true;
        this.mgmtMessage = e?.error?.message || e?.error?.title || 'تعذّر إنشاء السهم.';
      }
    });
  }

  assignSector(s: StockManagementItem): void {
    const sectorId = this.mgmtPickedSector[s.id];
    if (!sectorId) return;
    this.mgmtBusy = true;
    this.mgmtMessage = '';
    this.api.assignStockSector(s.id, sectorId).subscribe({
      next: (updated) => {
        this.mgmtBusy = false;
        this.mgmtError = false;
        this.mgmtMessage = `تم تعيين ${updated.ticker} إلى قطاع ${updated.sectorNameAr || ''}.`;
        const idx = this.mgmtStocks.findIndex((x) => x.id === s.id);
        if (idx >= 0) this.mgmtStocks[idx] = updated;
        this.cache.clear();
      },
      error: (e) => {
        this.mgmtBusy = false;
        this.mgmtError = true;
        this.mgmtMessage = e?.error?.message || 'تعذّر تعيين القطاع.';
      }
    });
  }

  removeFromSector(s: StockManagementItem): void {
    if (!confirm(`هل أنت متأكد من إزالة السهم ${s.ticker} من قطاعه الحالي؟`)) return;
    this.mgmtBusy = true;
    this.mgmtMessage = '';
    this.api.removeStockFromSector(s.id).subscribe({
      next: (updated) => {
        this.mgmtBusy = false;
        this.mgmtError = false;
        this.mgmtMessage = `تمت إزالة ${updated.ticker} من قطاعه.`;
        const idx = this.mgmtStocks.findIndex((x) => x.id === s.id);
        if (idx >= 0) this.mgmtStocks[idx] = updated;
        this.cache.clear();
      },
      error: (e) => {
        this.mgmtBusy = false;
        this.mgmtError = true;
        this.mgmtMessage = e?.error?.message || 'تعذّر إزالة السهم من القطاع.';
      }
    });
  }

  addToIndex(s: StockManagementItem): void {
    const indexId = this.mgmtPickedIndex[s.id];
    if (!indexId) return;
    this.mgmtBusy = true;
    this.mgmtMessage = '';
    this.api.addStockToIndex(s.id, indexId).subscribe({
      next: (c) => {
        this.mgmtBusy = false;
        this.mgmtError = false;
        this.mgmtMessage = `تمت إضافة ${s.ticker} إلى مؤشر ${c.indexCode}.`;
      },
      error: (e) => {
        this.mgmtBusy = false;
        this.mgmtError = true;
        this.mgmtMessage = e?.error?.message || 'تعذّر إضافة السهم للمؤشر.';
      }
    });
  }

  removeFromIndex(s: StockManagementItem): void {
    const indexId = this.mgmtPickedIndex[s.id];
    if (!indexId) return;
    const idx = this.mgmtIndices.find((i) => i.id === indexId);
    if (!confirm(`هل أنت متأكد من إزالة السهم ${s.ticker} من مؤشر ${idx?.code || indexId}؟`)) return;
    this.mgmtBusy = true;
    this.mgmtMessage = '';
    this.api.removeStockFromIndex(s.id, indexId).subscribe({
      next: () => {
        this.mgmtBusy = false;
        this.mgmtError = false;
        this.mgmtMessage = `تمت إزالة ${s.ticker} من المؤشر.`;
        this.mgmtPickedIndex[s.id] = undefined;
      },
      error: (e) => {
        this.mgmtBusy = false;
        this.mgmtError = true;
        this.mgmtMessage = e?.error?.message || 'تعذّر إزالة السهم من المؤشر.';
      }
    });
  }
}

