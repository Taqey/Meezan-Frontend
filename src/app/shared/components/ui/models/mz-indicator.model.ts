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
