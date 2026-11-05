import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shimmer placeholders for grids, KPI strips, and details pages while data loads.
 * Uses `display: contents` on host so when placed inside `.mz-stats` or `.mz-grid`,
 * its items are direct CSS grid children and occupy the exact same columns/gaps/heights.
 */
@Component({
  selector: 'app-loading-skeletons',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display: contents' },
  templateUrl: './loading-skeletons.component.html',
  styleUrl: './loading-skeletons.component.css',
})
export class LoadingSkeletonsComponent {
  @Input() count = 6;
  @Input() variant: 'card' | 'kpi' | 'stat' | 'details' = 'card';
  @Input() cardType: 'stock' | 'fund' | 'entity' | 'index' = 'stock';

  get range(): number[] {
    return Array.from({ length: Math.max(0, this.count) }, (_, i) => i);
  }

  trackIdx(index: number): number {
    return index;
  }
}
