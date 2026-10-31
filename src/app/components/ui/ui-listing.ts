import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Search, SlidersHorizontal, ChevronRight, ChevronLeft, ChevronDown, type LucideIconData } from 'lucide-angular';
import { LoadingSkeletonsComponent } from '../loading-skeletons/loading-skeletons.component';
import {
  MzBadgeComponent, MzButtonComponent, MzChipComponent, MzFavoriteButtonComponent, MzFilterDropdownComponent,
  MzMetricItemComponent, MzPaginationButtonComponent, MzSearchInputComponent, MzSelectComponent, MzStatCardComponent,
  MzStatusTagComponent, type MzFilterOption, type MzMetric, type MzOption, type MzStat
} from './ui-small';

/* ───────────── PageHeader ───────────── */
@Component({
  selector: 'mz-page-header',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <header class="mz-header">
      <div>
        <div class="mz-header-meta">
          <span class="mz-header-badge" *ngIf="badge">{{ badge }}</span>
          <span class="mz-header-count" *ngIf="count">• {{ count }}</span>
        </div>
        <h1>{{ title }}</h1>
        <p *ngIf="description">{{ description }}</p>
      </div>
      <div class="mz-header-actions"><ng-content select="[actions]"></ng-content></div>
    </header>
  `
})
export class MzPageHeaderComponent {
  @Input() badge = '';
  @Input() count = '';
  @Input() title = '';
  @Input() description = '';
}

/* ───────────── StatsRow ───────────── */
@Component({
  selector: 'mz-stats-row',
  standalone: true,
  imports: [CommonModule, MzStatCardComponent, LoadingSkeletonsComponent],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <section class="mz-stats" [class.cols-3]="(stats.length || count) === 3" *ngIf="!loading; else sk">
      <mz-stat-card *ngFor="let s of stats; trackBy: trackStat" [stat]="s"></mz-stat-card>
    </section>
    <ng-template #sk>
      <section class="mz-stats" [class.cols-3]="(stats.length || count) === 3">
        <app-loading-skeletons variant="stat" [count]="stats.length || count"></app-loading-skeletons>
      </section>
    </ng-template>
  `
})
export class MzStatsRowComponent {
  @Input() stats: MzStat[] = [];
  @Input() loading = false;
  @Input() count = 4;

  trackStat(index: number, s: MzStat): string {
    return s.label || String(index);
  }
}

/* ───────────── QuickFilterTabs ───────────── */
export interface MzTab { id: string; label: string; count?: number | null; }

@Component({
  selector: 'mz-quick-filter-tabs',
  standalone: true,
  imports: [CommonModule, MzChipComponent],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <div class="mz-tabs" role="tablist">
      <mz-chip *ngFor="let t of tabs" [active]="t.id === active" (selected)="onChange.emit(t.id)">
        {{ t.label }}<ng-container *ngIf="t.count != null"> ({{ t.count }})</ng-container>
      </mz-chip>
    </div>
  `
})
export class MzQuickFilterTabsComponent {
  @Input() tabs: MzTab[] = [];
  @Input() active = '';
  @Output() onChange = new EventEmitter<string>();
}

/* ───────────── FiltersBar ───────────── */
export type MzFilterControl =
  | { id: string; kind: 'multi'; label: string; allLabel: string; options: MzFilterOption[]; selected: string[]; hidden?: boolean }
  | { id: string; kind: 'select'; label: string; options: MzOption[]; value: string; hidden?: boolean };

export interface MzFiltersConfig {
  searchValue: string;
  searchPlaceholder: string;
  controls: MzFilterControl[];
  sort?: { options: MzOption[]; value: string; label: string } | null;
  advanced?: { label: string; open: boolean; count?: number } | null;
}

@Component({
  selector: 'mz-filters-bar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MzSearchInputComponent, MzSelectComponent, MzFilterDropdownComponent],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <div class="mz-card mz-filters">
      <div class="mz-filters-search">
        <mz-search-input [value]="config.searchValue" [placeholder]="config.searchPlaceholder" (valueChange)="searchChange.emit($event)"></mz-search-input>
      </div>
      <div class="mz-filters-controls">
        <ng-container *ngFor="let c of config.controls">
          <ng-container *ngIf="!c.hidden">
            <mz-filter-dropdown *ngIf="c.kind === 'multi'" [label]="c.label" [allLabel]="c.allLabel" [options]="c.options" [selected]="c.selected"
                                (selectedChange)="controlChange.emit({ id: c.id, values: $event })"></mz-filter-dropdown>
            <mz-select *ngIf="c.kind === 'select'" [options]="c.options" [value]="c.value" [ariaLabel]="c.label"
                       (valueChange)="controlChange.emit({ id: c.id, values: [$any($event)] })"></mz-select>
          </ng-container>
        </ng-container>
        <mz-select *ngIf="config.sort as s" [options]="s.options" [value]="s.value" [ariaLabel]="s.label"
                   (valueChange)="sortChange.emit($any($event))"></mz-select>
        <button *ngIf="config.advanced as a" type="button" class="mz-btn soft mz-advanced-btn" [attr.aria-expanded]="a.open" (click)="advancedClick.emit()">
          <lucide-icon [img]="TuneIcon" [size]="16" style="color:var(--mz-primary)"></lucide-icon>
          <span>{{ a.label }}</span><span class="mz-badge pill" *ngIf="a.count">{{ a.count }}</span>
        </button>
      </div>
    </div>
  `
})
export class MzFiltersBarComponent {
  readonly TuneIcon = SlidersHorizontal;
  @Input() config!: MzFiltersConfig;
  @Output() searchChange = new EventEmitter<string>();
  @Output() controlChange = new EventEmitter<{ id: string; values: string[] }>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() advancedClick = new EventEmitter<void>();
}

/* ───────────── ResultsInfo ───────────── */
export interface MzLegendItem { label: string; tone?: 'good' | 'bad'; }

@Component({
  selector: 'mz-results-info',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <div class="mz-results">
      <span class="mz-results-main">{{ text }}</span>
      <span *ngIf="note">{{ note }}</span>
      <ng-content></ng-content>
      <div class="mz-legend" *ngIf="legend?.length">
        <span class="mz-legend-item" *ngFor="let l of legend"><span class="mz-legend-dot" [class.bad]="l.tone === 'bad'"></span>{{ l.label }}</span>
      </div>
    </div>
  `
})
export class MzResultsInfoComponent {
  @Input() text = '';
  @Input() note?: string | null;
  @Input() legend?: MzLegendItem[] | null;
}

/* ───────────── ListingCard (single card for ALL listing pages) ───────────── */
export interface MzListingCardData {
  id: string | number;
  title: string;
  subtitle?: string | null;
  /** Badges next to the header (e.g. change %, count pill). */
  badges?: { label: string; tone?: 'default' | 'neutral' | 'danger' | 'warn' | 'outline' }[];
  mainValue?: string | null;
  mainUnit?: string | null;
  metrics?: MzMetric[];
  ribbon?: { text: string; aside?: string | null; tone?: 'good' | 'bad' | 'neutral' } | null;
  tags?: { label: string; tone?: 'good' | 'bad' | 'neutral'; note?: string | null }[];
  footerItems?: (string | { label: string; title?: string })[];
  sectorBadge?: { label: string; bg: string; color: string } | null;
  favoriteSymbol?: string | null;
  link?: string | unknown[] | null;
  featured?: boolean;
  logoUrl?: string | null;
  icon?: LucideIconData | null;
  linkLabel?: string | null;
  isFundCard?: boolean;
}

@Component({
  selector: 'mz-listing-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MzBadgeComponent, MzFavoriteButtonComponent, MzMetricItemComponent, MzStatusTagComponent],
  host: { class: 'mz', style: 'display:block;min-width:0' },
  template: `
    <a class="mz-card hoverable mz-lcard" [class.is-fund-card]="card.isFundCard" [class.is-stock-card]="!card.isFundCard && !!card.favoriteSymbol" [class.featured]="card.featured" [routerLink]="card.link || null">
      <div class="mz-lcard-top">
        <!-- Fund card header: single row (Logo -> Name -> Star -> Vertical Badges column) -->
        <div class="mz-lcard-fund-head" *ngIf="card.isFundCard">
          <div class="mz-lcard-fund-logo">
            <div *ngIf="card.logoUrl && !logoFailed" class="mz-lcard-logo-wrap" style="width:48px;height:48px;flex-shrink:0;border-radius:10px;border:1px solid rgba(188,202,192,.35);background:#fff;display:flex;align-items:center;justify-content:center;padding:3px;box-shadow:0 1px 2px rgba(0,0,0,0.03);">
              <img [src]="card.logoUrl" [alt]="card.title" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" loading="lazy" (error)="logoFailed = true" />
            </div>
            <span *ngIf="(!card.logoUrl || logoFailed) && card.icon" class="mz-stat-icon" style="width:48px;height:48px;"><lucide-icon [img]="card.icon" [size]="22"></lucide-icon></span>
            <div *ngIf="(!card.logoUrl || logoFailed) && !card.icon" class="mz-lcard-logo-placeholder"></div>
          </div>
          <div class="mz-lcard-fund-name-wrap">
            <span class="mz-lcard-sub" *ngIf="card.subtitle">{{ card.subtitle }}</span>
            <h3 class="mz-lcard-title fund-card-title" [attr.title]="card.title">{{ card.title }}</h3>
          </div>
          <div class="mz-lcard-fund-star-col">
            <mz-favorite-button *ngIf="card.favoriteSymbol" class="mz-lcard-fund-star" [symbol]="card.favoriteSymbol"></mz-favorite-button>
          </div>
          <div class="mz-lcard-fund-badges-col" *ngIf="card.badges?.length">
            <mz-badge *ngFor="let b of card.badges" [tone]="b.tone || 'default'" [titleText]="b.label">{{ b.label }}</mz-badge>
          </div>
        </div>

        <!-- Default (non-fund) header -->
        <div class="mz-lcard-head" *ngIf="!card.isFundCard">
          <div class="mz-lcard-id">
            <div *ngIf="card.logoUrl && !logoFailed" class="mz-lcard-logo-wrap" style="width:48px;height:48px;flex-shrink:0;border-radius:10px;border:1px solid rgba(188,202,192,.35);background:#fff;display:flex;align-items:center;justify-content:center;padding:3px;box-shadow:0 1px 2px rgba(0,0,0,0.03);">
              <img [src]="card.logoUrl" [alt]="card.title" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" loading="lazy" (error)="logoFailed = true" />
            </div>
            <span *ngIf="(!card.logoUrl || logoFailed) && card.icon" class="mz-stat-icon" style="width:48px;height:48px;"><lucide-icon [img]="card.icon" [size]="22"></lucide-icon></span>
            <div class="mz-lcard-text">
              <span class="mz-lcard-sub" *ngIf="card.subtitle">{{ card.subtitle }}</span>
              <h3 class="mz-lcard-title" [attr.title]="card.title">{{ card.title }}</h3>
              <mz-favorite-button *ngIf="card.favoriteSymbol" [symbol]="card.favoriteSymbol"></mz-favorite-button>
            </div>
          </div>
          <div class="mz-lcard-badges" *ngIf="card.badges?.length">
            <mz-badge *ngFor="let b of card.badges" [tone]="b.tone || 'default'"><span class="mz-ltr" style="white-space:nowrap">{{ b.label }}</span></mz-badge>
          </div>
        </div>
        <div class="mz-lcard-main" *ngIf="card.mainValue != null">
          <span class="mz-lcard-main-value mz-ltr">{{ card.mainValue }}</span>
          <span class="mz-lcard-main-unit" *ngIf="card.mainUnit">{{ card.mainUnit }}</span>
        </div>
        <div class="mz-lcard-metrics" *ngIf="card.metrics?.length">
          <mz-metric-item *ngFor="let m of card.metrics" [label]="m.label" [value]="m.value" [tone]="m.tone" [ltr]="!!m.ltr"></mz-metric-item>
        </div>
      </div>
      <div class="mz-lcard-bottom">
        <div class="mz-lcard-ribbon-wrap" *ngIf="!card.metrics?.length">
          <div class="mz-lcard-ribbon" *ngIf="card.ribbon as r" [ngClass]="r.tone || 'neutral'">
            <span>{{ r.text }}</span><span *ngIf="r.aside" style="font-size:10px;opacity:.8">{{ r.aside }}</span>
          </div>
          <div class="mz-lcard-ribbon empty" *ngIf="!card.ribbon">
            <span>&nbsp;</span>
          </div>
        </div>
        <div class="mz-lcard-tags" *ngIf="card.tags?.length">
          <ng-container *ngFor="let t of card.tags">
            <div class="mz-lcard-tag-row">
              <mz-status-tag [tone]="t.tone || 'neutral'" [label]="t.label"></mz-status-tag>
            </div>
            <div class="mz-lcard-tag-note" *ngIf="t.note" [attr.title]="t.note">
              <span>{{ t.note }}</span>
            </div>
          </ng-container>
        </div>
        <div class="mz-lcard-foot" *ngIf="card.sectorBadge || card.footerItems?.length || card.linkLabel">
          <div class="mz-lcard-foot-start">
            <span *ngIf="card.sectorBadge as sb"
                  class="mz-badge mz-sector-badge"
                  [attr.title]="sb.label"
                  [style.background]="sb.bg"
                  [style.color]="sb.color">
              {{ sb.label }}
            </span>
          </div>
          <div class="mz-lcard-foot-end">
            <ng-container *ngFor="let f of card.footerItems">
              <span *ngIf="isStr(f)">{{ f }}</span>
              <span *ngIf="!isStr(f)" [attr.title]="f.title || f.label">{{ f.label }}</span>
            </ng-container>
            <span *ngIf="card.linkLabel" style="color:var(--mz-primary);display:inline-flex;align-items:center;gap:2px">{{ card.linkLabel }}<lucide-icon [img]="LinkIcon" [size]="14"></lucide-icon></span>
          </div>
        </div>
      </div>
    </a>
  `
})
export class MzListingCardComponent {
  readonly LinkIcon = ChevronLeft;
  @Input() card!: MzListingCardData;
  logoFailed = false;

  isStr(val: unknown): val is string {
    return typeof val === 'string';
  }
}

/* ───────────── CardsGrid ───────────── */
@Component({
  selector: 'mz-cards-grid',
  standalone: true,
  imports: [CommonModule, MzListingCardComponent],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <section class="mz-grid cols-3" [class.mz-first-stagger]="isFirstLoad">
      <mz-listing-card
        *ngFor="let c of cards; let i = index; trackBy: trackCard"
        [card]="c"
        [style.--item-index]="i">
      </mz-listing-card>
    </section>
  `
})
export class MzCardsGridComponent {
  @Input() cards: MzListingCardData[] = [];
  isFirstLoad = true;
  trackCard = (_: number, c: MzListingCardData) => c.id;

  constructor() {
    // Stagger animation plays on first mount only; not replayed on filter/page changes
    setTimeout(() => {
      this.isFirstLoad = false;
    }, 600);
  }
}

/* ───────────── Pagination ───────────── */
@Component({
  selector: 'mz-pagination',
  standalone: true,
  imports: [CommonModule, MzPaginationButtonComponent],
  host: { class: 'mz', style: 'display:block' },
  template: `
    <nav class="mz-pagination" *ngIf="totalPages > 1" aria-label="التنقل بين الصفحات">
      <mz-pagination-button [disabled]="page <= 1" (pressed)="pageChange.emit(page - 1)">السابق</mz-pagination-button>
      <mz-pagination-button *ngFor="let p of pages" [active]="p === page" (pressed)="pageChange.emit(p)">{{ p }}</mz-pagination-button>
      <mz-pagination-button [disabled]="page >= totalPages" (pressed)="pageChange.emit(page + 1)">التالي</mz-pagination-button>
    </nav>
  `
})
export class MzPaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();
  get pages(): number[] {
    const max = 5;
    let start = Math.max(1, this.page - Math.floor(max / 2));
    const end = Math.min(this.totalPages, start + max - 1);
    start = Math.max(1, end - max + 1);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }
}

export const MZ_ICONS = { Search, ChevronRight, ChevronDown };
