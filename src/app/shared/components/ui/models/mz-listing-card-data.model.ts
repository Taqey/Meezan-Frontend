import { type LucideIconData } from 'lucide-angular';
import { type MzMetric } from './mz-metric.model';

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
