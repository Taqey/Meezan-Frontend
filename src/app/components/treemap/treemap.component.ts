import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface TreemapItem {
  id: string | number;
  label: string; // Ticker or Short Code
  subLabel?: string | null; // e.g. Arabic name or price
  value: number; // Area weight / market cap (must be > 0)
  changePct: number | null | undefined;
  price?: number | null;
  pointsChange?: number | null;
  weightPct?: number | null;
  shariahStatus?: string | null;
  link: string | any[];
  tooltip: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LayoutTile {
  item: TreemapItem;
  rect: Rect;
  color: string;
  ink: string;
  fontSize: number;
  showDetails: boolean;
}

@Component({
  selector: 'app-treemap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="treemap-wrapper">
      <div class="heat-legend no-print">
        <span class="legend-item"><i class="heat-dot up-strong"></i> +3% فأكثر</span>
        <span class="legend-item"><i class="heat-dot up"></i> أداء إيجابي</span>
        <span class="legend-item"><i class="heat-dot neutral"></i> 0.00%</span>
        <span class="legend-item"><i class="heat-dot down"></i> أداء سلبي</span>
        <span class="legend-item"><i class="heat-dot down-strong"></i> -3% فأقل</span>
        <span class="legend-item"><i class="heat-dot flat"></i> بدون بيانات</span>
        <span *ngIf="sizeNote" class="muted ms-auto">{{ sizeNote }}</span>
      </div>

      <div #container class="treemap-container" [style.height.px]="height">
        <div
          *ngFor="let tile of tiles; trackBy: trackTile"
          class="treemap-tile"
          [style.left.px]="tile.rect.x"
          [style.top.px]="tile.rect.y"
          [style.width.px]="tile.rect.w"
          [style.height.px]="tile.rect.h"
          [style.background-color]="tile.color"
          [style.color]="tile.ink"
          [attr.title]="tile.item.tooltip"
          (click)="onTileClick(tile.item)"
        >
          <div class="tile-content" [style.font-size.px]="tile.fontSize">
            <span class="tile-code" *ngIf="tile.rect.w >= 28 && tile.rect.h >= 18">{{ tile.item.label }}</span>
            <span *ngIf="tile.showDetails && tile.item.changePct !== null && tile.item.changePct !== undefined" class="tile-change" dir="ltr">
              {{ formatSignedPct(tile.item.changePct) }}
            </span>
            <span *ngIf="tile.showDetails && tile.item.subLabel" class="tile-sub">
              {{ tile.item.subLabel }}
            </span>
          </div>
        </div>

        <div *ngIf="tiles.length === 0" class="treemap-empty">
          <span>لا توجد بيانات كافية لعرض الخريطة الحرارية</span>
        </div>
      </div>

      <div *ngIf="unweightedCount > 0" class="treemap-unweighted-note">
        <span class="note-bullet">ℹ</span>
        <span>{{ unweightedCount }} {{ unweightedLabel }}</span>
      </div>
    </div>
  `,
  styles: [`
    .treemap-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }
    .treemap-unweighted-note {
      font-size: 0.85rem;
      color: var(--muted-foreground, #6b7280);
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 4px;
    }
    .note-bullet {
      color: var(--primary, #0f766e);
      font-weight: 700;
    }
    .treemap-container {
      position: relative;
      width: 100%;
      background: var(--surface-card, #ffffff);
      border: 1px solid var(--border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
      direction: rtl;
    }
    @media (max-width: 768px) {
      .treemap-container {
        height: 420px !important;
      }
    }
    .treemap-tile {
      position: absolute;
      box-sizing: border-box;
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      cursor: pointer;
      overflow: hidden;
      transition: filter 0.15s ease, transform 0.15s ease;
      user-select: none;
      padding: 2px;
    }
    .treemap-tile:hover {
      filter: brightness(1.12);
      z-index: 2;
      box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.6);
    }
    .tile-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      width: 100%;
      height: 100%;
      line-height: 1.15;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 2px 4px;
    }
    .tile-code {
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .tile-change {
      font-weight: 600;
      opacity: 0.95;
    }
    .tile-sub {
      font-size: 0.85em;
      opacity: 0.85;
      max-width: 95%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .treemap-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--muted-foreground, #6b7280);
      font-size: 0.95rem;
    }
    .heat-legend {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      font-size: 0.82rem;
      color: var(--muted-foreground, #6b7280);
      padding: 0 4px;
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .heat-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
    .heat-dot.up-strong { background-color: #0b7245; }
    .heat-dot.up { background-color: #2b9a66; }
    .heat-dot.neutral { background-color: #3f444d; }
    .heat-dot.down { background-color: #c93b3b; }
    .heat-dot.down-strong { background-color: #a12020; }
    .heat-dot.flat { background-color: #6b7280; }
  `]
})
export class TreemapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() items: TreemapItem[] = [];
  @Input() height = 580;
  @Input() sizeNote?: string | null;
  @Input() unweightedCount = 0;
  @Input() unweightedLabel = 'عناصر بدون وزن غير معروضة في الخريطة';

  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  tiles: LayoutTile[] = [];
  private resizeObserver?: ResizeObserver;

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    if (this.containerRef?.nativeElement && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.computeLayout();
      });
      this.resizeObserver.observe(this.containerRef.nativeElement);
    }
    this.computeLayout();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || changes['height'] || changes['unweightedCount']) {
      this.computeLayout();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  trackTile(_index: number, tile: LayoutTile): string | number {
    return tile.item.id;
  }

  onTileClick(item: TreemapItem): void {
    if (item.link) {
      if (Array.isArray(item.link)) {
        this.router.navigate(item.link);
      } else if (typeof item.link === 'string') {
        this.router.navigateByUrl(item.link);
      }
    }
  }

  formatSignedPct(v: number): string {
    const num = Number(v);
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  }

  // Squarified treemap layout algorithm (Bruls, Huizing, van Wijk) with exact pixel snapping
  computeLayout(): void {
    if (!this.containerRef?.nativeElement) return;
    const containerW = this.containerRef.nativeElement.clientWidth || 800;
    const containerH = this.height || 580;

    const validItems = this.items.filter((it) => it.value && it.value > 0);
    if (validItems.length === 0 || containerW <= 0 || containerH <= 0) {
      this.tiles = [];
      return;
    }

    // Sort descending by value
    const sorted = [...validItems].sort((a, b) => b.value - a.value);
    const totalVal = sorted.reduce((sum, item) => sum + item.value, 0);

    // Normalize values to total canvas area
    const totalArea = containerW * containerH;
    const areas = sorted.map((item) => (item.value / totalVal) * totalArea);

    const layoutRects: Rect[] = [];
    this.squarify(areas, [], { x: 0, y: 0, w: containerW, h: containerH }, layoutRects);

    this.tiles = sorted.map((item, i) => {
      const rect = layoutRects[i] || { x: 0, y: 0, w: 0, h: 0 };
      const { color, ink } = this.resolveColor(item.changePct);
      const minDim = Math.min(rect.w, rect.h);
      const fontSize = Math.max(10, Math.min(18, Math.floor(minDim / 5)));
      const showDetails = rect.w >= 60 && rect.h >= 40;

      return {
        item,
        rect,
        color,
        ink,
        fontSize,
        showDetails
      };
    });
  }

  private squarify(children: number[], row: number[], rect: Rect, result: Rect[]): void {
    if (children.length === 0) {
      if (row.length > 0) {
        this.layoutRow(row, rect, result, true);
      }
      return;
    }

    const c = children[0];
    const side = Math.min(rect.w, rect.h);
    if (row.length === 0) {
      this.squarify(children.slice(1), [c], rect, result);
      return;
    }

    const currentWorst = this.worst(row, side);
    const newWorst = this.worst([...row, c], side);

    if (newWorst <= currentWorst) {
      this.squarify(children.slice(1), [...row, c], rect, result);
    } else {
      const remainingRect = this.layoutRow(row, rect, result, false);
      this.squarify(children, [], remainingRect, result);
    }
  }

  private worst(row: number[], side: number): number {
    if (side <= 0) return Infinity;
    const rowSum = row.reduce((a, b) => a + b, 0);
    if (rowSum <= 0) return Infinity;

    let maxAspect = 0;
    const s2 = side * side;
    const r2 = rowSum * rowSum;

    for (const area of row) {
      if (area <= 0) continue;
      const aspect1 = (s2 * area) / r2;
      const aspect2 = r2 / (s2 * area);
      const maxVal = Math.max(aspect1, aspect2);
      if (maxVal > maxAspect) maxAspect = maxVal;
    }
    return maxAspect;
  }

  private layoutRow(row: number[], rect: Rect, result: Rect[], isLast: boolean): Rect {
    const rowSum = row.reduce((a, b) => a + b, 0);
    if (rowSum <= 0 || rect.w <= 0 || rect.h <= 0) return rect;

    if (rect.w >= rect.h) {
      // Shorter side is height. Row thickness is along width.
      let rowThickness = rect.h > 0 ? rowSum / rect.h : 0;
      if (isLast) {
        // Last row snaps to the remaining width
        rowThickness = rect.w;
      }

      let offset = 0;
      for (let i = 0; i < row.length; i++) {
        const area = row[i];
        let length = rowThickness > 0 ? area / rowThickness : 0;
        if (i === row.length - 1) {
          length = Math.max(0, rect.h - offset);
        }
        result.push({
          x: Math.round(rect.x),
          y: Math.round(rect.y + offset),
          w: Math.round(rowThickness),
          h: Math.round(length)
        });
        offset += length;
      }

      const nextW = Math.max(0, rect.w - rowThickness);
      return {
        x: rect.x + rowThickness,
        y: rect.y,
        w: nextW,
        h: rect.h
      };
    } else {
      // Shorter side is width. Row thickness is along height.
      let rowThickness = rect.w > 0 ? rowSum / rect.w : 0;
      if (isLast) {
        rowThickness = rect.h;
      }

      let offset = 0;
      for (let i = 0; i < row.length; i++) {
        const area = row[i];
        let length = rowThickness > 0 ? area / rowThickness : 0;
        if (i === row.length - 1) {
          length = Math.max(0, rect.w - offset);
        }
        result.push({
          x: Math.round(rect.x + offset),
          y: Math.round(rect.y),
          w: Math.round(length),
          h: Math.round(rowThickness)
        });
        offset += length;
      }

      const nextH = Math.max(0, rect.h - rowThickness);
      return {
        x: rect.x,
        y: rect.y + rowThickness,
        w: rect.w,
        h: nextH
      };
    }
  }

  private resolveColor(change: number | null | undefined): { color: string; ink: string } {
    if (change === null || change === undefined) {
      return { color: '#4b5563', ink: '#ffffff' }; // gray for no data
    }
    const val = Number(change);
    if (val === 0) {
      return { color: '#333b48', ink: '#e2e8f0' }; // neutral dark slate for 0
    }
    // TradingView smooth color palette
    if (val >= 3) return { color: '#0b7245', ink: '#ffffff' };
    if (val >= 1.5) return { color: '#168a54', ink: '#ffffff' };
    if (val > 0) return { color: '#27a868', ink: '#ffffff' };
    if (val <= -3) return { color: '#a12020', ink: '#ffffff' };
    if (val <= -1.5) return { color: '#bf2c2c', ink: '#ffffff' };
    if (val < 0) return { color: '#d94141', ink: '#ffffff' };
    return { color: '#333b48', ink: '#e2e8f0' };
  }
}
