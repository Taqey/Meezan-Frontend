import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface HeatTileData {
  id: string | number;
  title: string;
  /** Null renders as "—". */
  valueText?: string | null;
  grow: number;
  color: string;
  ink: string;
  link: string | unknown[] | null;
  tooltip: string;
}

/** Flex-tile heatmap: size by flex share, color by performance. */
@Component({
  selector: 'app-entity-heatmap',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="heat-legend no-print">
      <span><i class="heat-dot up"></i> أداء إيجابي</span>
      <span><i class="heat-dot down"></i> أداء سلبي</span>
      <span><i class="heat-dot flat"></i> بدون بيانات</span>
      <span *ngIf="sizeNote" class="muted">{{ sizeNote }}</span>
    </div>
    <div class="heat-grid">
      <a *ngFor="let t of tiles; trackBy: trackTile"
         [routerLink]="t.link"
         class="heat-tile"
         [style.flex-grow]="t.grow"
         [style.background]="t.color"
         [style.color]="t.ink"
         [attr.title]="t.tooltip">
        <strong>{{ t.title }}</strong>
        <span>{{ t.valueText ?? '—' }}</span>
      </a>
    </div>
  `
})
export class EntityHeatmapComponent {
  @Input() tiles: HeatTileData[] = [];
  /** Optional sizing note (e.g. market-cap sizing); hidden when absent. */
  @Input() sizeNote?: string | null;

  trackTile(_index: number, tile: HeatTileData): string | number {
    return tile.id;
  }
}
