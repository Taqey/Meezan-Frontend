import { type MzOption } from './mz-option.model';
import { type MzFilterControl } from './mz-filter-control.model';

export interface MzFiltersConfig {
  searchValue: string;
  searchPlaceholder: string;
  controls: MzFilterControl[];
  sort?: { options: MzOption[]; value: string; label: string } | null;
  advanced?: { label: string; open: boolean; count?: number } | null;
}
