import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSkeletonsComponent } from '../loading-skeletons/loading-skeletons.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import {
  MzCardsGridComponent, MzFiltersBarComponent, MzPageHeaderComponent, MzPaginationComponent, MzQuickFilterTabsComponent,
  MzResultsInfoComponent, MzStatsRowComponent, type MzFiltersConfig, type MzLegendItem, type MzListingCardData, type MzTab
} from './ui-listing';
import { MzBackLinkComponent } from './ui-details';
import { MzSpinnerComponent } from './mz-spinner.component';
import type { MzStat } from './ui-small';

export interface MzListingConfig {
  backLink?: { label: string; to: string | unknown[] } | null;
  header: { badge: string; count?: string; title: string; description: string };
  stats?: MzStat[] | null;
  statsLoading?: boolean;
  statsCount?: number;
  tabs?: MzTab[] | null;
  activeTab?: string;
  filters?: MzFiltersConfig | null;
  results?: { text: string; note?: string | null; legend?: MzLegendItem[] | null } | null;
  cards: MzListingCardData[];
  skeletonCount?: number;
  cardType?: 'stock' | 'fund' | 'entity' | 'index';
  loading?: boolean;
  error?: { title: string; message: string } | null;
  empty: { title: string; message: string };
  page?: number;
  totalPages?: number;
}

/**
 * ListingPage template: BackLink → PageHeader → StatsRow → QuickFilterTabs → FiltersBar → ResultsInfo → CardsGrid → Pagination.
 * One config object drives every listing page; only the data differs.
 * Slots: [actions] header actions, [advanced] advanced-filter panel, [view] replaces the cards grid
 * (alternate table / heat-map views), [footer] trailing note.
 */
@Component({
  selector: 'mz-listing-page',
  standalone: true,
  imports: [
    CommonModule, MzBackLinkComponent, MzPageHeaderComponent, MzStatsRowComponent, MzQuickFilterTabsComponent, MzFiltersBarComponent,
    MzResultsInfoComponent, MzCardsGridComponent, MzPaginationComponent, LoadingSkeletonsComponent, EmptyStateComponent, MzSpinnerComponent
  ],
  host: { class: 'mz mz-page', style: 'display:block' },
  template: `
    <mz-back-link *ngIf="config.backLink" [label]="config.backLink.label" [to]="config.backLink.to"></mz-back-link>
    <ng-content select="[backLink]"></ng-content>

    <mz-page-header [badge]="config.header.badge" [count]="config.header.count || ''" [title]="config.header.title" [description]="config.header.description">
      <ng-container actions><ng-content select="[actions]"></ng-content></ng-container>
    </mz-page-header>

    <mz-stats-row [stats]="config.stats || []" [loading]="!!config.statsLoading" [count]="config.statsCount || 4"></mz-stats-row>

    <section class="mz-filters-section">
      <mz-quick-filter-tabs [tabs]="config.tabs || []" [active]="config.activeTab || ''" (onChange)="tabChange.emit($event)"></mz-quick-filter-tabs>
      <mz-filters-bar *ngIf="config.filters" [config]="config.filters" (searchChange)="searchChange.emit($event)"
                      (controlChange)="controlChange.emit($event)" (sortChange)="sortChange.emit($event)" (advancedClick)="advancedClick.emit()"></mz-filters-bar>
      <div class="mz-card mz-advanced-panel" *ngIf="config.filters?.advanced?.open"><ng-content select="[advanced]"></ng-content></div>
    </section>

    <mz-results-info [text]="config.results?.text || ''" [note]="config.results?.note" [legend]="config.results?.legend"><ng-content select="[resultsExtra]"></ng-content></mz-results-info>

    <div class="mz-cards-area-wrap">
      <!-- Initial load (no cards yet): show exact placeholders AND smooth spinner -->
      <ng-container *ngIf="config.loading && !config.error && !config.cards.length">
        <app-loading-skeletons variant="card" [count]="config.skeletonCount || 20" [cardType]="config.cardType || 'stock'"></app-loading-skeletons>
        <mz-spinner [active]="true" size="large" [overlay]="true" [showLabel]="true" label="جارٍ التحميل..."></mz-spinner>
      </ng-container>

      <!-- Error state -->
      <app-empty-state *ngIf="config.error" [title]="config.error.title" [message]="config.error.message" actionLabel="إعادة المحاولة" [loading]="!!config.loading" (action)="retry.emit()"></app-empty-state>

      <!-- Loaded OR refreshing with existing cards dimmed -->
      <ng-container *ngIf="!config.error && (!config.loading || config.cards.length > 0)">
        <div class="mz-cards-content" [class.is-dimmed]="!!config.loading && config.cards.length > 0">
          <ng-content select="[view]"></ng-content>
          <ng-container *ngIf="!customView">
            <mz-cards-grid *ngIf="config.cards.length" [cards]="config.cards"></mz-cards-grid>
            <app-empty-state *ngIf="!config.cards.length && !config.loading" [title]="config.empty.title" [message]="config.empty.message"></app-empty-state>
          </ng-container>
        </div>
        <mz-spinner [active]="!!config.loading && config.cards.length > 0" size="large" [overlay]="true" [showLabel]="true" label="جارٍ تحديث النتائج..."></mz-spinner>
      </ng-container>
    </div>

    <mz-pagination *ngIf="!customView && (config.totalPages || 1) > 1" [page]="config.page || 1" [totalPages]="config.totalPages || 1" (pageChange)="pageChange.emit($event)"></mz-pagination>
    <ng-content select="[footer]"></ng-content>
  `
})
export class MzListingPageComponent {
  @Input() config!: MzListingConfig;
  /** True when a projected [view] (table / heat-map) replaces the cards grid. */
  @Input() customView = false;
  @Output() tabChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() controlChange = new EventEmitter<{ id: string; values: string[] }>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() advancedClick = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() retry = new EventEmitter<void>();
}
