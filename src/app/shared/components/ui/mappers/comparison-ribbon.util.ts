import { ComparisonBadgeComponent } from '../../comparison-badge/comparison-badge.component';
import { type MzListingCardData } from '../models/mz-listing-card-data.model';

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
