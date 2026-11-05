import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MzChipComponent } from '../mz-chip/mz-chip.component';
import { type MzPerfPeriod } from '../models/mz-perf-period.model';
import { MZ_DEFAULT_PERF_PERIODS } from '../constants/mz_default_perf_periods.constants';

@Component({
  selector: 'mz-performance-chart',
  standalone: true,
  imports: [CommonModule, MzChipComponent],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-performance-chart.component.html',
})
export class MzPerformanceChartComponent {
  @Input() periods: MzPerfPeriod[] = MZ_DEFAULT_PERF_PERIODS;
  @Input() active = '1Y';
  @Input() points: number[] = [];
  @Input() ariaLabel = '';
  @Input() emptyText = 'لا توجد بيانات سعرية تاريخية متاحة لهذا الصندوق.';
  @Output() periodChange = new EventEmitter<string>();
  get path(): string {
    const p = this.points.filter((n) => Number.isFinite(n));
    if (p.length < 2) return '';
    const min = Math.min(...p), max = Math.max(...p), span = max - min || 1;
    return p.map((v, i) => `${i ? 'L' : 'M'}${((i / (p.length - 1)) * 600).toFixed(1)},${(170 - ((v - min) / span) * 160).toFixed(1)}`).join(' ');
  }
  get areaPath(): string { return this.path ? `${this.path} L600,180 L0,180 Z` : ''; }
}
