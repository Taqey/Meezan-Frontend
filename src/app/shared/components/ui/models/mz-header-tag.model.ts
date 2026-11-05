/* ───────────── DetailsHeaderCard ───────────── */
export interface MzHeaderTag {
  label: string;
  link?: string | unknown[] | null;
  tone?: 'default' | 'neutral' | 'danger' | 'warn' | 'outline';
  ariaLabel?: string | null;
  externalUrl?: string | null;
}
