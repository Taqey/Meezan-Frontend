import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { AdminStocksManagementService } from './admin-stocks-management.service';

@Injectable({ providedIn: 'root' })
export class AdminSectorDailyService {
  constructor(
    private api: ApiService,
    private mgmt: AdminStocksManagementService
  ) {}

  // Sector Daily Job panel state
  sectorDailyStatus: any = null;

  sectorDailyRecalculating = false;

  sectorDailyRangeRunning = false;

  sectorDailyMessage = '';

  sectorDailyIsError = false;

  rangeFromDate = '';

  rangeToDate = '';

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
    const sec = this.mgmt.mgmtSectors?.find((s: any) => s.id === sectorId);
    return sec?.nameAr || `قطاع #${sectorId}`;
  }
}
