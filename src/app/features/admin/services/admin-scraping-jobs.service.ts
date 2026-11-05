import { Injectable } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { ApiService } from '../../../core/api/api.service';
import { LiveProgressInfo, RefreshMarketSnapshotsResult, ScrapeStatusResponse } from '../../../shared/models/api.models';
import { AdminSectorDailyService } from './admin-sector-daily.service';
import { AdminFundsSyncService } from './admin-funds-sync.service';

@Injectable({ providedIn: 'root' })
export class AdminScrapingJobsService {
  constructor(
    private api: ApiService,
    private toast: ToastService,
    private sectorDaily: AdminSectorDailyService,
    private fundsSync: AdminFundsSyncService
  ) {}

  // Scraping tab
  scrapeStatus?: ScrapeStatusResponse;

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

  get isScrapingRunning(): boolean {
    return this.isDailyRunning || this.isQuarterlyRunning;
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
    this.sectorDaily.fetchSectorDailyStatus();
  }

  get isAnyJobRunning(): boolean {
    return this.isDailyRunning || this.isQuarterlyRunning || this.isMarketSnapshotsRunning || this.fundsSync.isFundSyncRunning;
  }
}
