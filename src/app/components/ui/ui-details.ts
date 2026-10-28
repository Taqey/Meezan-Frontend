import { Component, EventEmitter, Input, Output, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowRight, ChevronLeft, ExternalLink } from 'lucide-angular';
import { RevealDirective } from '../../directives/reveal.directive';
import {
  MzBadgeComponent, MzAuthorityCardComponent, MzChipComponent, MzFavoriteButtonComponent, MzIndicatorCardComponent,
  MzMetricItemComponent, type MzAuthority, type MzMetric
} from './ui-small';

/* ───────────── BackLink ───────────── */
@Component({
  selector: 'mz-back-link',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  host: { class: 'mz', style: 'display:block' },
  template: `<a class="mz-backlink" [routerLink]="to"><lucide-icon [img]="ArrowIcon" [size]="16"></lucide-icon>{{ label }}</a>`
})
export class MzBackLinkComponent {
  readonly ArrowIcon = ArrowRight;
  @Input() label = '';
  @Input() to: string | unknown[] = '/';
}

/* ───────────── DetailsSection (generic white section card) ───────────── */
@Component({
  selector: 'mz-details-section',
  standalone: true,
  imports: [CommonModule, RevealDirective],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <section class="mz-card mz-dsection" appReveal>
      <div class="mz-dsection-head" *ngIf="title || eyebrow">
        <div>
          <span class="mz-eyebrow" *ngIf="eyebrow">{{ eyebrow }}</span>
          <h2 class="mz-dsection-title">{{ title }}</h2>
        </div>
        <div><ng-content select="[action]"></ng-content></div>
      </div>
      <ng-content></ng-content>
    </section>
  `
})
export class MzDetailsSectionComponent {
  @Input() eyebrow = '';
  @Input() title = '';
}

/* ───────────── DetailsHeaderCard ───────────── */
export interface MzHeaderTag {
  label: string;
  link?: string | unknown[] | null;
  tone?: 'default' | 'neutral' | 'danger' | 'warn' | 'outline';
  ariaLabel?: string | null;
  externalUrl?: string | null;
}

@Component({
  selector: 'mz-details-header-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MzBadgeComponent, MzFavoriteButtonComponent],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <div class="mz-card mz-dheader">
      <div class="mz-dheader-main">
        <div class="mz-dheader-code" *ngIf="code || secondaryName || favoriteSymbol">
          <mz-favorite-button *ngIf="favoriteSymbol" [symbol]="favoriteSymbol"></mz-favorite-button>
          <span class="mz-ltr" *ngIf="code">{{ code }}</span>
          <span class="mz-ltr" *ngIf="secondaryName">{{ secondaryName }}</span>
        </div>
        <div class="mz-dheader-titlerow" style="display:flex;align-items:center;gap:14px;">
          <div *ngIf="logoUrl && !logoFailed" style="width:56px;height:56px;flex-shrink:0;border-radius:12px;border:1px solid rgba(188,202,192,.35);background:#fff;display:flex;align-items:center;justify-content:center;padding:4px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <img [src]="logoUrl" [alt]="title" style="width:100%;height:100%;object-fit:contain;border-radius:8px;" (error)="logoFailed = true" />
          </div>
          <h1 style="margin:0;">{{ title }}</h1>
          <ng-content select="[titleBadge]"></ng-content>
        </div>
        <div class="mz-dheader-tags" *ngIf="tags?.length">
          <ng-container *ngFor="let t of tags">
            <span *ngIf="t.link; else plain" class="mz-header-tag-wrap">
              <a class="mz-header-tag-link" [routerLink]="t.link" [attr.aria-label]="t.ariaLabel || ('عرض جميع صناديق ' + t.label)">
                <mz-badge [tone]="t.tone || 'neutral'" [pill]="true">
                  <span>{{ t.label }}</span>
                  <span class="mz-manager-arrow" aria-hidden="true">←</span>
                </mz-badge>
              </a>
              <a *ngIf="t.externalUrl" [href]="t.externalUrl" target="_blank" rel="noopener noreferrer"
                 class="mz-manager-ext" [attr.aria-label]="'الموقع الخارجي لـ ' + t.label">
                <lucide-icon [img]="ExternalLinkIcon" [size]="12"></lucide-icon>
              </a>
            </span>
            <ng-template #plain><mz-badge [tone]="t.tone || 'neutral'" [pill]="true">{{ t.label }}</mz-badge></ng-template>
          </ng-container>
        </div>
        <ng-content select="[extra]"></ng-content>
      </div>
      <div class="mz-dheader-price" *ngIf="priceLabel || price != null">
        <span class="mz-dheader-price-label">{{ priceLabel }}</span>
        <div class="mz-dheader-price-value"><span class="mz-ltr">{{ price ?? '—' }}</span><small>{{ currency }}</small></div>
        <span class="mz-change" *ngIf="changeText" [ngClass]="changeTone || 'muted'">{{ changeText }}</span>
      </div>
      <ng-content select="[aside]"></ng-content>
    </div>
  `
})
export class MzDetailsHeaderCardComponent {
  readonly ExternalLinkIcon = ExternalLink;
  @Input() logoUrl?: string | null;
  @Input() title = '';
  @Input() code?: string | null;
  @Input() secondaryName?: string | null;
  @Input() favoriteSymbol?: string | null;
  @Input() tags: MzHeaderTag[] = [];
  @Input() priceLabel = '';
  @Input() price?: string | null;
  @Input() currency = '';
  @Input() changeText?: string | null;
  @Input() changeTone?: 'positive' | 'negative' | 'muted' | null;
  logoFailed = false;
}

/* ───────────── SupportResistanceCard ───────────── */
export interface MzSrPoint { key: string; label: string; value: string; pos: number; kind: 's' | 'r' | 'p'; }

@Component({
  selector: 'mz-support-resistance-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MzDetailsSectionComponent],
  host: { class: 'mz', style: 'display:block;height:100%' },
  template: `
    <mz-details-section [eyebrow]="eyebrow" [title]="title" style="display:block;height:100%">
      <span action class="mz-badge neutral" *ngIf="pivotLabel">{{ pivotLabel }}</span>
      <p class="mz-authority-note" *ngIf="note">{{ note }}</p>
      <ng-container *ngIf="points.length; else empty">
        <div class="mz-sr-bar">
          <div class="mz-sr-marker" *ngIf="markerPos != null" [style.right.%]="markerPos">
            <span class="mz-sr-marker-tag">{{ markerLabel }}</span>
            <div class="mz-sr-marker-stem"></div>
          </div>
          <div *ngFor="let p of points" class="mz-sr-pt" [ngClass]="p.kind" [style.right.%]="p.pos">
            <i></i>
            <b>{{ p.label }}</b>
            <span class="mz-ltr">{{ p.value }}</span>
          </div>
        </div>
      </ng-container>
      <ng-template #empty><p class="mz-authority-note">{{ emptyText }}</p></ng-template>
    </mz-details-section>
  `
})
export class MzSupportResistanceCardComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() pivotLabel?: string | null;
  @Input() note?: string | null;
  @Input() points: MzSrPoint[] = [];
  @Input() markerPos: number | null = null;
  @Input() markerLabel = '';
  @Input() emptyText = '';
}

/* ───────────── FairValueCard ───────────── */
export interface MzFairMethod { name: string; value: string; outlier?: boolean; outlierLabel?: string; }

@Component({
  selector: 'mz-fair-value-card',
  standalone: true,
  imports: [CommonModule, MzDetailsSectionComponent],
  host: { class: 'mz', style: 'display:block;height:100%' },
  template: `
    <mz-details-section [eyebrow]="eyebrow" [title]="title" style="display:block;height:100%">
      <span action><ng-content select="[badge]"></ng-content></span>
      <div *ngIf="unavailable" class="mz-sharia-summary neutral" style="display:block">
        <strong>{{ unavailableTitle }}</strong><p class="mz-authority-note" style="margin:6px 0 0">{{ unavailableText }}</p>
      </div>
      <ng-container *ngIf="!unavailable">
        <div class="mz-fv-hero">
          <strong class="mz-ltr">{{ value }}</strong><span class="mz-authority-meta">{{ currency }}</span>
          <span class="mz-change" *ngIf="gapText" [ngClass]="gapTone || 'muted'" style="direction:rtl">{{ gapText }}</span>
        </div>
        <p class="mz-authority-note" *ngIf="formulaNote">{{ formulaNote }}</p>
        <div class="mz-fv-rows" *ngIf="methods.length">
          <div class="mz-fv-row" *ngFor="let m of methods" [style.opacity]="m.outlier ? .6 : 1">
            <span>{{ m.name }}<em *ngIf="m.outlier" style="font-style:normal;color:var(--mz-warn);margin-inline-start:6px">{{ m.outlierLabel }}</em></span>
            <strong class="mz-ltr">{{ m.value }}</strong>
          </div>
        </div>
      </ng-container>
    </mz-details-section>
  `
})
export class MzFairValueCardComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() unavailable = false;
  @Input() unavailableTitle = '';
  @Input() unavailableText = '';
  @Input() value = '';
  @Input() currency = '';
  @Input() gapText?: string | null;
  @Input() gapTone?: 'positive' | 'negative' | 'muted' | null;
  @Input() formulaNote?: string | null;
  @Input() methods: MzFairMethod[] = [];
}

/* ───────────── InfoGrid / MarketIndicatorsSection ───────────── */
export interface MzIndicator {
  label: string;
  value: string | number | null | undefined;
  hint?: string | null;
  ltr?: boolean;
  link?: string | unknown[] | null;
  ariaLabel?: string | null;
  externalUrl?: string | null;
}

@Component({
  selector: 'mz-info-grid',
  standalone: true,
  imports: [CommonModule, MzIndicatorCardComponent],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <div class="mz-infogrid">
      <mz-indicator-card *ngFor="let i of items" [label]="i.label" [value]="i.value" [hint]="i.hint" [ltr]="!!i.ltr" [link]="i.link" [ariaLabel]="i.ariaLabel" [externalUrl]="i.externalUrl"></mz-indicator-card>
    </div>
  `
})
export class MzInfoGridComponent {
  @Input() items: MzIndicator[] = [];
}

@Component({
  selector: 'mz-market-indicators-section',
  standalone: true,
  imports: [MzDetailsSectionComponent, MzInfoGridComponent],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <mz-details-section [eyebrow]="eyebrow" [title]="title">
      <span action><ng-content select="[action]"></ng-content></span>
      <mz-info-grid [items]="items"></mz-info-grid>
      <ng-content></ng-content>
    </mz-details-section>
  `
})
export class MzMarketIndicatorsSectionComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() items: MzIndicator[] = [];
}

export interface MzShariaRatio {
  label: string;
  value: string;
  subtext?: string | null;
  tone?: 'positive' | 'negative' | 'neutral' | null;
}

@Component({
  selector: 'mz-sharia-authorities-section',
  standalone: true,
  imports: [CommonModule, MzDetailsSectionComponent, MzAuthorityCardComponent, MzMetricItemComponent],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <mz-details-section [eyebrow]="eyebrow" [title]="title">
      <div class="mz-sharia-summary" [ngClass]="summaryTone" *ngIf="summaryText">
        <span>{{ summaryText }}</span><span class="mz-authority-meta" *ngIf="summaryNote">{{ summaryNote }}</span>
      </div>
      <div class="mz-authority-grid" *ngIf="authorities.length">
        <mz-authority-card *ngFor="let a of authorities" [authority]="a" (action)="authorityAction.emit(a)"></mz-authority-card>
      </div>
      <ng-container *ngIf="shariaRatios?.length || ratios?.length">
        <div class="mz-sharia-ratios-wrap">
          <div class="mz-sharia-ratios-head">
            <h3 class="mz-sharia-ratios-title">{{ ratiosTitle }}</h3>
            <span class="mz-sharia-ratios-meta" *ngIf="ratiosMeta">{{ ratiosMeta }}</span>
          </div>
          <div class="mz-sharia-ratios-grid" *ngIf="shariaRatios?.length">
            <div class="mz-sharia-ratio-card" *ngFor="let r of shariaRatios">
              <span class="mz-sharia-ratio-label">{{ r.label }}</span>
              <strong class="mz-sharia-ratio-value">{{ r.value }}</strong>
              <span class="mz-sharia-ratio-sub" *ngIf="r.subtext" [ngClass]="r.tone || 'neutral'">{{ r.subtext }}</span>
            </div>
          </div>
          <div class="mz-infogrid" *ngIf="!shariaRatios?.length && ratios?.length">
            <mz-metric-item *ngFor="let r of ratios" [label]="r.label" [value]="r.value" [tone]="r.tone" [ltr]="!!r.ltr"></mz-metric-item>
          </div>
        </div>
      </ng-container>
      <ng-content></ng-content>
    </mz-details-section>
  `
})
export class MzShariaAuthoritiesSectionComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() summaryText = '';
  @Input() summaryNote?: string | null;
  @Input() summaryTone: 'good' | 'bad' | 'neutral' | '' = '';
  @Input() authorities: MzAuthority[] = [];
  @Input() ratiosTitle = '';
  @Input() ratiosMeta?: string | null;
  @Input() ratios: MzMetric[] = [];
  @Input() shariaRatios?: MzShariaRatio[] | null;
  @Output() authorityAction = new EventEmitter<MzAuthority>();
}

/* ───────────── InfoCard ───────────── */
@Component({
  selector: 'mz-info-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <a class="mz-card mz-infocard" [class.hoverable]="!!link" [routerLink]="link || null">
      <span class="mz-infocard-label">{{ label }}</span>
      <h3 class="mz-infocard-title">{{ title }}</h3>
      <p class="mz-infocard-desc" *ngIf="description">{{ description }}</p>
      <span class="mz-infocard-foot" *ngIf="footerLabel">{{ footerLabel }}<lucide-icon [img]="LinkIcon" [size]="14"></lucide-icon></span>
    </a>
  `
})
export class MzInfoCardComponent {
  readonly LinkIcon = ChevronLeft;
  @Input() label = '';
  @Input() title = '';
  @Input() description?: string | null;
  @Input() footerLabel?: string | null;
  @Input() link?: string | unknown[] | null;
}

/* ───────────── Fund-only: PerformanceChart / AllocationBreakdown ───────────── */
export interface MzPerfPeriod { id: string; label: string; }

export const MZ_DEFAULT_PERF_PERIODS: MzPerfPeriod[] = [
  { id: '1W', label: 'أسبوع' },
  { id: '1M', label: '1 شهر' },
  { id: '3M', label: '3 أشهر' },
  { id: '6M', label: '6 أشهر' },
  { id: '1Y', label: 'سنة' },
  { id: '3Y', label: '3 سنين' },
  { id: '5Y', label: '5 سنين' }
];

@Component({
  selector: 'mz-performance-chart',
  standalone: true,
  imports: [CommonModule, MzChipComponent],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <div class="mz-perf-tabs"><mz-chip *ngFor="let p of periods" [active]="p.id === active" (selected)="periodChange.emit(p.id)">{{ p.label }}</mz-chip></div>
    <ng-container *ngIf="path; else empty">
      <svg viewBox="0 0 600 180" preserveAspectRatio="none" role="img" [attr.aria-label]="ariaLabel" style="width:100%;height:220px">
        <path [attr.d]="areaPath" fill="rgba(0,105,72,.10)"></path>
        <path [attr.d]="path" fill="none" stroke="#006948" stroke-width="2.5" vector-effect="non-scaling-stroke"></path>
      </svg>
    </ng-container>
    <ng-template #empty><p class="mz-authority-note">{{ emptyText }}</p></ng-template>
  `
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

export interface MzAllocation { label: string; pct: number; color: string; }

export interface MzNumberLineBand {
  id: string;
  label: string;
  min: number;
  max: number;
  color: string;
  limitText: string;
  description?: string;
  lane?: number;
}

export interface MzAllocationCardItem {
  id: string;
  label: string;
  limitText: string;
  description?: string;
  color: string;
  hasNumericLimit: boolean;
  min?: number;
  max?: number;
}

/** Track which animated NumberLine instances have played in this session to prevent replaying on cached returns */
const PLAYED_NUMBER_LINES = new Set<string>();

@Component({
  selector: 'mz-number-line',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz mz-numline-host', style: 'display:block' },
  template: `
    <div class="mz-numline-wrap" role="img" [attr.aria-label]="ariaLabel" [class.is-animated]="hasEntered">
      <!-- Ticks Header / Scale -->
      <div class="mz-numline-scale" aria-hidden="true">
        <span *ngFor="let t of ticks" class="mz-numline-tick-label" [style.right.%]="t">
          {{ t }}%
        </span>
      </div>

      <!-- Main Scale Track & Lanes -->
      <div class="mz-numline-track-area">
        <!-- Thin background axis line with tick notches -->
        <div class="mz-numline-axis" aria-hidden="true">
          <span *ngFor="let t of ticks" class="mz-numline-notch" [style.right.%]="t"></span>
        </div>

        <!-- Rendered Band Lanes -->
        <div class="mz-numline-lanes" [style.min-height.px]="lanesCount * 44">
          <div *ngFor="let b of bands; let idx = index"
               class="mz-numline-band-row"
               [style.top.px]="(b.lane ?? idx) * 44"
               [class.is-active]="activeBandId === b.id"
               [class.is-dimmed]="activeBandId && activeBandId !== b.id"
               (mouseenter)="onBandEnter(b)"
               (mouseleave)="onBandLeave()"
               (focus)="onBandEnter(b)"
               (blur)="onBandLeave()"
               tabindex="0"
               role="figure"
               [attr.aria-label]="b.label + ': ' + b.limitText">
            <!-- Filled Band Bar -->
            <div class="mz-numline-bar"
                 [style.right.%]="b.min"
                 [style.width.%]="Math.max(1.5, b.max - b.min)"
                 [style.background]="b.color">
              <!-- Animated Glow Line -->
              <span class="mz-numline-glow"></span>
            </div>

            <!-- Limit Marker Stem & Tag on Min Bound (if min > 0) -->
            <div *ngIf="b.min > 0" class="mz-numline-marker min" [style.right.%]="b.min">
              <span class="mz-numline-pin" [style.border-color]="b.color"></span>
              <span class="mz-numline-tag" [style.color]="b.color">{{ b.min }}%</span>
            </div>

            <!-- Limit Marker Stem & Tag on Max Bound (if max < 100) -->
            <div *ngIf="b.max < 100" class="mz-numline-marker max" [style.right.%]="b.max">
              <span class="mz-numline-pin" [style.border-color]="b.color"></span>
              <span class="mz-numline-tag" [style.color]="b.color">{{ b.max }}%</span>
            </div>

            <!-- Floating Label inside / above band -->
            <div class="mz-numline-caption"
                 [style.right.%]="(b.min + b.max) / 2"
                 [title]="b.label + ' (' + b.limitText + ')'">
              <span class="mz-numline-dot" [style.background]="b.color"></span>
              <span class="mz-numline-name">{{ b.label }}</span>
              <span class="mz-numline-limit">{{ b.limitText }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Floating Tooltip for Active Hover/Focus -->
      <div *ngIf="hoveredBand" class="mz-numline-tooltip"
           [style.right.%]="(hoveredBand.min + hoveredBand.max) / 2"
           [style.top.px]="(hoveredBand.lane ?? 0) * 44 - 12">
        <strong>{{ hoveredBand.label }}</strong>: {{ hoveredBand.limitText }}
      </div>
    </div>
  `
})
export class MzNumberLineComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly Math = Math;

  @Input() instanceId = 'numline_default';
  @Input() bands: MzNumberLineBand[] = [];
  @Input() ticks: number[] = [0, 25, 50, 75, 100];
  @Input() direction: 'rtl' | 'ltr' = 'rtl';
  @Input() activeBandId: string | null = null;
  @Input() ariaLabel = 'مقياس توزيع الأصول المستهدف من 0% إلى 100%';

  @Output() bandHover = new EventEmitter<string | null>();

  hoveredBand: MzNumberLineBand | null = null;
  hasEntered = false;
  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  get lanesCount(): number {
    if (!this.bands.length) return 1;
    const maxLane = this.bands.reduce((max, b) => Math.max(max, b.lane ?? 0), 0);
    return Math.max(1, maxLane + 1);
  }

  ngOnInit(): void {
    if (PLAYED_NUMBER_LINES.has(this.instanceId)) {
      this.hasEntered = true;
    }
  }

  ngAfterViewInit(): void {
    if (this.hasEntered) return;

    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          this.hasEntered = true;
          PLAYED_NUMBER_LINES.add(this.instanceId);
          this.observer?.disconnect();
        }
      }, { threshold: 0.15 });
      this.observer.observe(this.el.nativeElement);
    } else {
      this.hasEntered = true;
      PLAYED_NUMBER_LINES.add(this.instanceId);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  onBandEnter(band: MzNumberLineBand): void {
    this.hoveredBand = band;
    this.bandHover.emit(band.id);
  }

  onBandLeave(): void {
    this.hoveredBand = null;
    this.bandHover.emit(null);
  }
}

// temporarily disabled until fund descriptions are standardized
export const SHOW_NUMBER_LINE = false;

@Component({
  selector: 'mz-allocation-breakdown',
  standalone: true,
  imports: [CommonModule, MzNumberLineComponent],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <!-- When SHOW_NUMBER_LINE is enabled, render the advanced multi-lane NumberLine card -->
    <ng-container *ngIf="showNumberLine; else originalView">
      <div class="mz-alloc-card">
        <div class="mz-alloc-head">
          <h4 class="mz-alloc-title">هيكل توزيع الأصول المستهدف (Asset Allocation)</h4>
          <span class="mz-alloc-badge" *ngIf="badgeText">{{ badgeText }}</span>
        </div>

        <!-- Advanced Multi-lane NumberLine Scale (when numeric bands exist) -->
        <ng-container *ngIf="bands.length > 0; else fallbackBar">
          <mz-number-line
            [instanceId]="instanceId"
            [bands]="bands"
            [activeBandId]="activeId"
            [ariaLabel]="ariaLabel"
            (bandHover)="onNumberLineHover($event)">
          </mz-number-line>
        </ng-container>

        <!-- Fallback Bar when no numeric limits parsed -->
        <ng-template #fallbackBar>
          <div class="mz-alloc-bar" role="img" [attr.aria-label]="ariaLabel">
            <span *ngFor="let a of displayItems" [style.width.%]="a.pct" [style.background]="a.color"></span>
          </div>
        </ng-template>

        <!-- Asset Allocation Breakdown Cards (below the number line) -->
        <div class="mz-alloc-grid" *ngIf="cards.length > 0">
          <div *ngFor="let c of cards"
               class="mz-alloc-box"
               [class.is-active]="activeId === c.id"
               [class.is-dimmed]="activeId && activeId !== c.id"
               (mouseenter)="onCardHover(c.id)"
               (mouseleave)="onCardLeave()"
               (focus)="onCardHover(c.id)"
               (blur)="onCardLeave()"
               tabindex="0">
            <div class="mz-alloc-box-head">
              <span class="mz-alloc-swatch" [style.background]="c.color"></span>
              <span class="mz-alloc-box-label">{{ c.label }}</span>
            </div>
            <p class="mz-alloc-box-val" [style.color]="c.color">{{ c.limitText }}</p>
            <span *ngIf="c.description" class="mz-alloc-box-sub">{{ c.description }}</span>
          </div>
        </div>

        <!-- Traditional items fallback if cards not passed -->
        <div class="mz-alloc-items" *ngIf="!cards.length && displayItems.length > 0">
          <div class="mz-alloc-item" *ngFor="let a of displayItems">
            <span class="mz-alloc-swatch" [style.background]="a.color"></span>
            {{ a.label }} <strong class="mz-ltr">{{ a.pct }}%</strong>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- Original Allocation Breakdown View (restored look: bar + cards below) -->
    <ng-template #originalView>
      <div class="mz-alloc-bar" role="img" [attr.aria-label]="ariaLabel">
        <span *ngFor="let a of displayItems" [style.width.%]="a.pct" [style.background]="a.color"></span>
      </div>
      <div class="mz-alloc-items">
        <div class="mz-alloc-item" *ngFor="let a of displayItems">
          <span class="mz-alloc-swatch" [style.background]="a.color"></span>
          {{ a.label }} <strong class="mz-ltr">{{ a.pct }}%</strong>
        </div>
      </div>
    </ng-template>
  `
})
export class MzAllocationBreakdownComponent {
  readonly showNumberLine = SHOW_NUMBER_LINE;
  @Input() instanceId = 'alloc_default';
  @Input() badgeText = 'معايير الالتزام والسياسة الاستثمارية';
  @Input() bands: MzNumberLineBand[] = [];
  @Input() cards: MzAllocationCardItem[] = [];
  @Input() items: MzAllocation[] = [];
  @Input() ariaLabel = 'هيكل توزيع الأصول المستهدف';

  activeId: string | null = null;

  get displayItems(): MzAllocation[] {
    if (this.items && this.items.length > 0) return this.items;
    if (this.bands && this.bands.length > 0) {
      return this.bands.map(b => ({
        label: b.label,
        pct: b.min > 0 ? b.min : b.max,
        color: b.color
      }));
    }
    return [];
  }

  onNumberLineHover(id: string | null): void {
    this.activeId = id;
  }

  onCardHover(id: string): void {
    this.activeId = id;
  }

  onCardLeave(): void {
    this.activeId = null;
  }
}

/* ───────────── DetailsPage layout (stack of sections) ───────────── */
@Component({
  selector: 'mz-details-page',
  standalone: true,
  host: { class: 'mz mz-stack', style: 'display:flex' },
  template: `<ng-content></ng-content>`
})
export class MzDetailsPageComponent {}
