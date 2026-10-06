import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Shimmer placeholders for grids and KPI strips while data loads. */
@Component({
  selector: 'app-loading-skeletons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="entity-grid" *ngIf="variant === 'card'" aria-hidden="true">
      <div class="skeleton-card" *ngFor="let n of range; trackBy: trackIdx">
        <div class="sk-line sk-title"></div>
        <div class="sk-line sk-text"></div>
        <div class="sk-line sk-price"></div>
      </div>
    </div>
    <div class="kpi-grid" *ngIf="variant === 'kpi'" aria-hidden="true">
      <div class="kpi-card" *ngFor="let n of range; trackBy: trackIdx">
        <div class="sk-line sk-text"></div>
        <div class="sk-line sk-price"></div>
      </div>
    </div>
  `
})
export class LoadingSkeletonsComponent {
  @Input() count = 6;
  @Input() variant: 'card' | 'kpi' = 'card';

  get range(): number[] {
    return Array.from({ length: Math.max(0, this.count) }, (_, i) => i);
  }

  trackIdx(index: number): number {
    return index;
  }
}
