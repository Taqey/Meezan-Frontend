import { type MzFilterOption } from './mz-filter-option.model';
import { type MzOption } from './mz-option.model';

/* ───────────── FiltersBar ───────────── */
export type MzFilterControl =
  | { id: string; kind: 'multi'; label: string; allLabel: string; options: MzFilterOption[]; selected: string[]; hidden?: boolean }
  | { id: string; kind: 'select'; label: string; options: MzOption[]; value: string; hidden?: boolean };
