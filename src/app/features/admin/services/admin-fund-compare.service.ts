import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { AdminFundsSyncService } from './admin-funds-sync.service';
import { AdminHistoricalSyncService } from './admin-historical-sync.service';

@Injectable({ providedIn: 'root' })
export class AdminFundCompareService {
  constructor(
    private api: ApiService,
    private fundsSync: AdminFundsSyncService,
    private historical: AdminHistoricalSyncService
  ) {}

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

  compareTimeframes = [
    { key: '1W', label: 'أسبوع' },
    { key: '1M', label: 'شهر' },
    { key: '3M', label: '3 شهور' },
    { key: '6M', label: '6 شهور' },
    { key: '1Y', label: 'سنة' },
    { key: 'ALL', label: 'الكل' }
  ];

  // Comparison Chart Modal methods
  openCompareChartModal(fundId?: number): void {
    this.showCompareChartModal = true;
    this.fundsSync.loadAdminFundPickerList();
    if (fundId) {
      this.compareChartSelectedFundId = fundId;
    } else if (!this.compareChartSelectedFundId && this.fundsSync.adminFundPickerList.length > 0) {
      this.compareChartSelectedFundId = this.fundsSync.adminFundPickerList[0].id;
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
    this.historical.closeHistoricalSyncModal();
    this.openCompareChartModal(fundId);
  }

  openHistoricalSyncForSelectedFund(): void {
    const fid = this.compareChartSelectedFundId;
    this.closeCompareChartModal();
    this.historical.historicalSelectedFundId = fid;
    this.historical.openHistoricalSyncModal();
  }

  loadCompareChartData(): void {
    if (!this.compareChartSelectedFundId) {
      if (this.fundsSync.adminFundPickerList.length > 0) {
        this.compareChartSelectedFundId = this.fundsSync.adminFundPickerList[0].id;
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
}
