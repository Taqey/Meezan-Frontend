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

import { formatCurrencyLabel } from '../../utils/currency-utils';

export interface TreemapItem {
  id: string | number;
  label: string; // Ticker or Short Code
  subLabel?: string | null; // e.g. Arabic name or price
  value: number; // Area weight / market cap (must be > 0)
  changePct: number | null | undefined;
  price?: number | null;
  currency?: string | null;
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
  templateUrl: './treemap.component.html',
  styleUrl: './treemap.component.css',
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

  get popoverCurrency(): string {
    return formatCurrencyLabel(this.popoverItem?.currency);
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
