import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { RefreshShariahDataResult, SeedShariahResultDto } from '../../../shared/models/api.models';
import { AdminShariahOverridesService } from './admin-shariah-overrides.service';

@Injectable({ providedIn: 'root' })
export class AdminShariahSeedService {
  constructor(
    private api: ApiService,
    private overrides: AdminShariahOverridesService
  ) {}

  // Shariah tab
  shariahRefreshing = false;

  shariahSeeding = false;

  verdictRecomputing = false;

  backfillingActivity = false;

  recomputeResult?: { message?: string | null; recomputedCount: number; changedCount: number } | null;

  refreshResult?: RefreshShariahDataResult;

  seedResult?: SeedShariahResultDto;

  seedJsonOverride = '';

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
        if (this.overrides.shariahSelectedTicker) {
          this.overrides.loadShariahOverrides(this.overrides.shariahSelectedTicker);
        }
      },
      error: (err) => {
        this.backfillingActivity = false;
        alert('فشل تنفيذ البذر: ' + (err.error?.message || err.message || 'خطأ غير متوقع'));
      }
    });
  }
}
