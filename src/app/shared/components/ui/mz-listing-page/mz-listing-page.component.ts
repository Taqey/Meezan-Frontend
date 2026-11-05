import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSkeletonsComponent } from '../../loading-skeletons/loading-skeletons.component';
import { EmptyStateComponent } from '../../empty-state/empty-state.component';
import { MzCardsGridComponent } from '../mz-cards-grid/mz-cards-grid.component';
import { MzFiltersBarComponent } from '../mz-filters-bar/mz-filters-bar.component';
import { MzPageHeaderComponent } from '../mz-page-header/mz-page-header.component';
import { MzPaginationComponent } from '../mz-pagination/mz-pagination.component';
import { MzQuickFilterTabsComponent } from '../mz-quick-filter-tabs/mz-quick-filter-tabs.component';
import { MzResultsInfoComponent } from '../mz-results-info/mz-results-info.component';
import { MzStatsRowComponent } from '../mz-stats-row/mz-stats-row.component';
import { MzBackLinkComponent } from '../mz-back-link/mz-back-link.component';
import { MzSpinnerComponent } from '../mz-spinner/mz-spinner.component';
import { type MzListingConfig } from '../models/mz-listing-config.model';

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
  templateUrl: './mz-listing-page.component.html',
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
