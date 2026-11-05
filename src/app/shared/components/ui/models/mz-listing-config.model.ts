import { type MzFiltersConfig } from './mz-filters-config.model';
import { type MzLegendItem } from './mz-legend-item.model';
import { type MzListingCardData } from './mz-listing-card-data.model';
import { type MzTab } from './mz-tab.model';
import { type MzStat } from './mz-stat.model';

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
