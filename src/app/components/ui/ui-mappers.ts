import { ComparisonBadgeComponent } from '../comparison-badge/comparison-badge.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import type { MzListingCardData } from './ui-listing';

/** Pure presentation helpers shared by the listing/details page configs (no business logic). */

export function signedPct(value: number | null | undefined, digits = 2): string | null {
  if (value === null || value === undefined || isNaN(Number(value))) return null;
  const v = Number(value);
  return `${v > 0 ? '+' : ''}${v.toFixed(digits)}%`;
}

export function pctTone(value: number | null | undefined): 'positive' | 'negative' | 'muted' {
  if (value === null || value === undefined || isNaN(Number(value))) return 'muted';
  return Number(value) > 0 ? 'positive' : Number(value) < 0 ? 'negative' : 'muted';
}

export function fmtNumber(value: number | null | undefined, digits = 2): string | null {
  if (value === null || value === undefined || isNaN(Number(value))) return null;
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Sharia status → tag, reusing the StatusBadge label/class rules. */
export function statusTag(status?: string | null): { label: string; tone: 'good' | 'bad' | 'neutral' } {
  const b = new StatusBadgeComponent();
  b.status = status;
  const cls = b.badgeClass;
  return { label: b.label, tone: cls === 'status-good' ? 'good' : cls === 'status-bad' ? 'bad' : 'neutral' };
}

/** Fair-value comparison → ribbon, reusing the ComparisonBadge wording/rules. */
export function comparisonRibbon(
  comparison?: string | null, fairValueDiffPct?: number | null, closingPrice?: number | null, fairValue?: number | null
): NonNullable<MzListingCardData['ribbon']> {
  const c = new ComparisonBadgeComponent();
  c.comparison = comparison;
  c.fairValueDiffPct = fairValueDiffPct;
  c.closingPrice = closingPrice;
  c.fairValue = fairValue;
  const cls = c.badgeClass;
  return { text: c.label, tone: cls === 'cheap' ? 'good' : cls === 'expensive' ? 'bad' : 'neutral' };
}

import { type StockListItemDto, type ConstituentItemDto } from '../../models/api.models';
import { indexShortNameFor, indexFullNameFor } from '../../models/market-icons';
import { getNonComplianceReasons, normalizeStatusValue } from '../../models/shariah-standards';
import { sectorAccentFor } from '../../models/market-icons';

export interface StockToCardOptions {
  parent?: 'sector' | 'index';
}

/** Shared stock card mapper: identical configuration across Stocks page, Sector detail, and Index detail. */
export function stockToCard(s: StockListItemDto | ConstituentItemDto, options?: StockToCardOptions): MzListingCardData {
  const tag = statusTag(s.shariahStatus);
  const reasons = normalizeStatusValue(s.shariahStatus) === 'noncompliant'
    ? getNonComplianceReasons({
        coreActivityCompliant: (s as any).coreActivityCompliant,
        categoryAr: (s as any).categoryAr,
        spHaramEarningPercentage: (s as any).spHaramEarningPercentage,
        loansPercentage: (s as any).loansPercentage
      })
    : [];
  const change = signedPct(s.changePct);

  // Footer items and sector badge resolution based on parent context
  let footerItems: (string | { label: string; title?: string })[] = [];
  let sectorBadge: MzListingCardData['sectorBadge'] = null;
  const hasWeight = s.weight !== null && s.weight !== undefined && !isNaN(Number(s.weight)) && Number(s.weight) > 0;
  const weightText = hasWeight ? `${Number(s.weight).toFixed(2)}%` : null;

  if (s.sectorNameAr) {
    const accent = sectorAccentFor((s as any).sectorNameEn || s.sectorNameAr);
    sectorBadge = {
      label: s.sectorNameAr,
      bg: accent.tint,
      color: accent.ink
    };
  }

  if (options?.parent === 'sector') {
    // 1. Sector page: ONLY the stock's weight in that sector labeled "الوزن في القطاع: X%".
    // Remove sector badge and all index badges.
    sectorBadge = null;
    if (weightText) {
      footerItems.push(`الوزن في القطاع: ${weightText}`);
    }
  } else if (options?.parent === 'index') {
    // 2. Index page: ONLY sector badge and weight in that index labeled "الوزن في المؤشر: X%".
    // Remove all index badges.
    if (weightText) {
      footerItems.push(`الوزن في المؤشر: ${weightText}`);
    }
  } else {
    // 3. Main Stocks page: sector badge once on the start side + real index badges group on the other side.
    const validCodes = (s.indices || [])
      .filter((code) => code && code.toUpperCase() !== 'SECTORAL-INDICES');
    if (validCodes.length) {
      footerItems = validCodes.map((code) => ({
        label: indexShortNameFor(code),
        title: indexFullNameFor(code).ar
      }));
    }
  }

  return {
    id: s.ticker,
    title: s.nameAr || s.ticker,
    subtitle: s.ticker || null,
    favoriteSymbol: s.ticker,
    badges: change ? [{ label: change, tone: pctTone(s.changePct) === 'negative' ? 'danger' : 'default' }] : [{ label: '—', tone: 'neutral' }],
    mainValue: fmtNumber(s.closingPrice) ?? '—',
    mainUnit: s.currency && s.currency.includes('دولار') ? '$' : 'ج.م',
    ribbon: comparisonRibbon(s.priceComparison, s.fairValueDiffPct, s.closingPrice, s.fairValue),
    tags: [{ label: tag.label, tone: tag.tone, note: reasons.length ? reasons.join(' · ') : null }],
    sectorBadge,
    footerItems,
    link: ['/stocks', s.ticker]
  };
}

