import { type LucideIconData } from 'lucide-angular';

/* ───────────────────────── Level 2 ───────────────────────── */
export interface MzStat {
  label: string;
  value: string | number | null;
  icon?: LucideIconData;
  chip?: string | null;
  accent?: boolean;
  /** Smaller text value (e.g. top performer name). */
  text?: string | null;
}
