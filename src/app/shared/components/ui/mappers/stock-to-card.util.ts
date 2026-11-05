import { type MzListingCardData } from '../models/mz-listing-card-data.model';
import { type StockListItemDto, type ConstituentItemDto } from '../../../models/api.models';
import { indexShortNameFor, indexFullNameFor, sectorAccentFor } from '../../../models/market-icons';
import { getNonComplianceReasons, normalizeStatusValue } from '../../../models/shariah-standards';
import { formatCurrencyLabel } from '../../../utils/currency-utils';
import { signedPct } from './signed-pct.util';
import { pctTone } from './pct-tone.util';
import { fmtNumber } from './fmt-number.util';
import { statusTag } from './status-tag.util';
import { comparisonRibbon } from './comparison-ribbon.util';
import { type StockToCardOptions } from '../models/stock-to-card-options.model';

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
    mainUnit: formatCurrencyLabel(s.currency),
    ribbon: comparisonRibbon(s.priceComparison, s.fairValueDiffPct, s.closingPrice, s.fairValue),
    tags: [{ label: tag.label, tone: tag.tone, note: reasons.length ? reasons.join(' · ') : null }],
    sectorBadge,
    footerItems,
    link: ['/stocks', s.ticker]
  };
}
