import { type MzListingCardData } from '../models/mz-listing-card-data.model';
import { normFundType, fundLogoUrl, normFundRiskLevel, fundRiskLabelAr } from '../../../models/fund-display';
import { type FundListItemDto, type FundType } from '../../../models/api.models';

export function fundToCard(
  fund: FundListItemDto,
  options?: {
    getFundIcon?: (type: FundType) => any;
    classificationBadge?: string;
  }
): MzListingCardData {
  const rawType = normFundType(fund.type);
  const badges: { label: string; tone?: any }[] = [];
  if (fund.isIslamic) {
    badges.push({ label: 'متوافق شرعاً', tone: 'default' });
  }
  const catBadge = options?.classificationBadge;
  if (catBadge) {
    badges.push({ label: catBadge, tone: 'neutral' });
  }

  const curr = fund.currency || 'EGP';
  const priceVal = fund.currentPrice != null ? (fund.currentPrice + ' ' + curr) : null;
  const changeVal = fund.dailyChange != null ? ((fund.dailyChange > 0 ? '+' : '') + fund.dailyChange + '%') : null;
  const ret1mVal = fund.return1M != null ? ((fund.return1M > 0 ? '+' : '') + fund.return1M.toFixed(2) + '%') : null;
  const aumVal = fund.aum != null ? ((fund.aum / 1e6).toFixed(1) + ' م ' + curr) : null;
  const feeVal = fund.managementFee != null ? (fund.managementFee + '%') : null;

  const stats: { label: string; value: string | null; tone?: 'positive' | 'negative' | 'muted' }[] = [
    { label: 'السعر', value: priceVal },
    { label: 'التغيير اليومي', value: changeVal, tone: fund.dailyChange != null ? (fund.dailyChange > 0 ? 'positive' : fund.dailyChange < 0 ? 'negative' : 'muted') : undefined },
    { label: 'العائد 1M', value: ret1mVal, tone: fund.return1M != null ? (fund.return1M > 0 ? 'positive' : fund.return1M < 0 ? 'negative' : 'muted') : undefined },
    { label: 'الأصول (AUM)', value: aumVal },
    { label: 'الرسوم السنوية', value: feeVal }
  ];
  const riskLabel = fundRiskLabelAr(normFundRiskLevel(fund.riskLevel));
  if (riskLabel !== null) {
    stats.push({ label: 'المخاطر', value: riskLabel });
  }

  return {
    id: fund.code,
    title: fund.displayName || fund.nameAr,
    subtitle: '',
    isFundCard: true,
    favoriteSymbol: 'FUND:' + fund.code,
    icon: options?.getFundIcon ? options.getFundIcon(rawType) : null,
    logoUrl: fundLogoUrl(fund.localLogoPath, fund.logoUrl),
    featured: fund.isFeatured,
    badges,
    metrics: stats.map(st => ({ label: st.label, value: st.value, tone: st.tone })),
    linkLabel: 'استعراض الصندوق',
    link: ['/funds', fund.slug || fund.id || fund.code]
  };
}
