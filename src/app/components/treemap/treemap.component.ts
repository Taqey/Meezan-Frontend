import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef
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
  hasName: boolean;
  hasSubLabel: boolean;
  hasChange: boolean;
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
        <span *ngIf="sizeNote" class="muted ms-auto legend-sizenote">{{ sizeNote }}</span>
      </div>

      <div #container class="treemap-container" [style.height.px]="computedHeight">
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
          (click)="onTileClick($event, tile.item)"
        >
          <div class="tile-content" [style.font-size.px]="tile.fontSize">
            <span class="tile-code" *ngIf="tile.hasName">{{ tile.item.label }}</span>
            <span *ngIf="tile.hasChange && tile.item.changePct !== null && tile.item.changePct !== undefined" class="tile-change" dir="ltr">
              {{ formatSignedPct(tile.item.changePct) }}
            </span>
            <span *ngIf="tile.hasSubLabel && tile.item.subLabel" class="tile-sub">
              {{ tile.item.subLabel }}
            </span>
          </div>
        </div>

        <!-- Small-screen Tap Popover for very small tiles -->
        <div
          *ngIf="popoverItem"
          class="treemap-popover"
          [style.left.px]="popoverX"
          [style.top.px]="popoverY"
          (click)="$event.stopPropagation()"
        >
          <div class="popover-header">
            <strong>{{ popoverItem.label }}</strong>
            <button type="button" class="popover-close" (click)="closePopover($event)">×</button>
          </div>
          <div class="popover-body">
            <div *ngIf="popoverItem.changePct !== null && popoverItem.changePct !== undefined" class="popover-row">
              <span>التغير:</span>
              <span dir="ltr" [class.popover-up]="popoverItem.changePct > 0" [class.popover-down]="popoverItem.changePct < 0">
                {{ formatSignedPct(popoverItem.changePct) }}
              </span>
            </div>
            <div *ngIf="popoverItem.price !== null && popoverItem.price !== undefined" class="popover-row">
              <span>السعر:</span>
              <span dir="ltr">{{ popoverItem.price | number:'1.2-2' }} ج.م</span>
            </div>
            <div *ngIf="popoverItem.subLabel && popoverItem.price == null" class="popover-row">
              <span>{{ popoverItem.subLabel }}</span>
            </div>
          </div>
          <a class="popover-link" (click)="navigateTo(popoverItem.link)">عرض التفاصيل ←</a>
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
      max-width: 100%;
      box-sizing: border-box;
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
      max-width: 100%;
      background: var(--surface-card, #ffffff);
      border: 1px solid var(--border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      box-sizing: border-box;
      direction: rtl;
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
      box-sizing: border-box;
    }
    .tile-code {
      font-weight: 700;
      letter-spacing: -0.02em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .tile-change {
      font-weight: 600;
      opacity: 0.95;
      white-space: nowrap;
    }
    .tile-sub {
      font-size: 0.85em;
      opacity: 0.85;
      max-width: 95%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      gap: 12px 16px;
      font-size: 0.82rem;
      color: var(--muted-foreground, #6b7280);
      padding: 0 4px;
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .legend-sizenote {
      white-space: normal;
    }
    .heat-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .heat-dot.up-strong { background-color: #0b7245; }
    .heat-dot.up { background-color: #2b9a66; }
    .heat-dot.neutral { background-color: #3f444d; }
    .heat-dot.down { background-color: #c93b3b; }
    .heat-dot.down-strong { background-color: #a12020; }
    .heat-dot.flat { background-color: #6b7280; }

    /* Popover */
    .treemap-popover {
      position: absolute;
      z-index: 20;
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      min-width: 150px;
      max-width: 240px;
      font-size: 12px;
      direction: rtl;
      pointer-events: auto;
    }
    .popover-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
      border-bottom: 1px solid #334155;
      padding-bottom: 4px;
    }
    .popover-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 16px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    .popover-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .popover-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .popover-up { color: #4ade80; font-weight: 700; }
    .popover-down { color: #f87171; font-weight: 700; }
    .popover-link {
      display: inline-block;
      margin-top: 8px;
      color: #38bdf8;
      text-decoration: underline;
      cursor: pointer;
      font-weight: 600;
    }
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
  computedHeight = 580;
  popoverItem: TreemapItem | null = null;
  popoverX = 0;
  popoverY = 0;

  private resizeObserver?: ResizeObserver;
  private debounceTimer: any = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    if (this.containerRef?.nativeElement && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        if (!entries || !entries.length) return;
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.computeLayout();
        }, 50);
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
    clearTimeout(this.debounceTimer);
    this.resizeObserver?.disconnect();
  }

  trackTile(_index: number, tile: LayoutTile): string | number {
    return tile.item.id;
  }

  onTileClick(event: MouseEvent, item: TreemapItem): void {
    // If the tile was too small for text, tapping it opens a small popover
    const tile = this.tiles.find((t) => t.item.id === item.id);
    if (tile && (!tile.hasName && !tile.hasChange)) {
      event.stopPropagation();
      this.openPopover(tile, event);
      return;
    }
    this.navigateTo(item.link);
  }

  openPopover(tile: LayoutTile, event: MouseEvent): void {
    this.popoverItem = tile.item;
    const containerRect = this.containerRef?.nativeElement?.getBoundingClientRect();
    if (containerRect) {
      let x = tile.rect.x + tile.rect.w / 2 - 80;
      let y = tile.rect.y + tile.rect.h / 2;
      // Clamp within container
      const containerW = containerRect.width;
      const containerH = this.computedHeight;
      x = Math.max(10, Math.min(x, containerW - 170));
      y = Math.max(10, Math.min(y, containerH - 120));
      this.popoverX = x;
      this.popoverY = y;
    }
  }

  closePopover(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.popoverItem = null;
  }

  navigateTo(link: string | any[]): void {
    if (!link) return;
    if (Array.isArray(link)) {
      this.router.navigate(link);
    } else if (typeof link === 'string') {
      this.router.navigateByUrl(link);
    }
  }

  formatSignedPct(v: number): string {
    const num = Number(v);
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  }

  computeLayout(): void {
    if (!this.containerRef?.nativeElement) return;
    const containerW = this.containerRef.nativeElement.clientWidth;
    if (containerW <= 0) return;

    // 1. Determine base height by width:
    // Below 640px: clamp(width x 1.25, 420px, 640px)
    // Between 640px and 1024px: clamp(width x 0.7, 380px, 600px)
    // Desktop (>= 1024px): keeps current height (this.height || 580)
    let currentHeight = this.height || 580;
    if (containerW < 640) {
      currentHeight = Math.round(Math.min(640, Math.max(420, containerW * 1.25)));
    } else if (containerW < 1024) {
      currentHeight = Math.round(Math.min(600, Math.max(380, containerW * 0.7)));
    }

    const validItems = (this.items || []).filter((it) => it.value && it.value > 0);
    if (validItems.length === 0) {
      this.computedHeight = currentHeight;
      this.tiles = [];
      this.cdr.markForCheck();
      return;
    }

    // Sort descending by value
    const sorted = [...validItems].sort((a, b) => b.value - a.value);
    const totalVal = sorted.reduce((sum, item) => sum + item.value, 0);

    // 2. Adaptive height growth:
    // If more than a quarter of the items would be below 44x30px, grow container height (up to 900px on mobile)
    let finalHeight = currentHeight;
    const maxHeight = containerW < 640 ? 900 : (containerW < 1024 ? 800 : currentHeight);

    let layoutRects: Rect[] = [];
    while (true) {
      const totalArea = containerW * finalHeight;
      const areas = sorted.map((item) => (item.value / totalVal) * totalArea);
      const testRects: Rect[] = [];
      this.squarify(areas, [], { x: 0, y: 0, w: containerW, h: finalHeight }, testRects);

      const smallCount = testRects.filter((r) => r.w < 44 || r.h < 30).length;
      if (smallCount <= sorted.length / 4 || finalHeight >= maxHeight) {
        layoutRects = testRects;
        break;
      }
      finalHeight = Math.min(maxHeight, finalHeight + 60);
    }

    this.computedHeight = finalHeight;

    this.tiles = sorted.map((item, i) => {
      const rect = layoutRects[i] || { x: 0, y: 0, w: 0, h: 0 };
      const { color, ink } = this.resolveColor(item.changePct);
      const minDim = Math.min(rect.w, rect.h);
      const fontSize = Math.max(10, Math.min(18, Math.floor(minDim / 5)));

      // Content visibility thresholds:
      // Below ~44x30: render without text (small popover on tap/hover)
      // Small but can fit ticker/name only: rect.w >= 44 && rect.h >= 24 -> name only, no price/subLabel
      // Medium: rect.w >= 60 && rect.h >= 40 -> name + change
      // Large: rect.w >= 75 && rect.h >= 55 -> name + change + subLabel
      const isTiny = rect.w < 44 || rect.h < 26;
      const hasName = !isTiny && rect.w >= 36 && rect.h >= 20;
      const hasChange = rect.w >= 56 && rect.h >= 38;
      const hasSubLabel = rect.w >= 75 && rect.h >= 54;

      return {
        item,
        rect,
        color,
        ink,
        fontSize,
        hasName,
        hasChange,
        hasSubLabel
      };
    });

    this.cdr.markForCheck();
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
