import type { ShariahStatus } from './common.model';

export enum ShariahSourceKey {
  HalalBourse = 1,
  Musaffa = 2,
  Kashif = 3,
  HalalInvest = 4,
  FaisalBank = 5,
  Ostoul = 6,
  Osoul = 6,
  Thndr = 7
}

/**
 * Tickers whose Shariah display is frozen to a single "يوجد لجنة شرعية" badge.
 * For this ticker group, detailed board opinions and AAOIFI/S&P metric panels are skipped entirely.
 */
export const SHARIAH_BOARD_FROZEN_TICKERS: readonly string[] = [
  'ADIB',
  'SAUD',
  'FAIT',
  'FAITA',
  'ATLC',
  'AMIA'
];


export const SHARIAH_SOURCE_NAMES: Record<number, { ar: string, en: string }> = {
  [ShariahSourceKey.HalalBourse]: { ar: 'بورصة حلال', en: 'Halal Bourse' },
  [ShariahSourceKey.Musaffa]: { ar: 'مصفّى', en: 'Musaffa' },
  [ShariahSourceKey.Kashif]: { ar: 'كاشف', en: 'Kashif' },
  [ShariahSourceKey.HalalInvest]: { ar: 'حلال إنفست', en: 'Halal Invest' },
  [ShariahSourceKey.FaisalBank]: { ar: 'بنك فيصل الإسلامي', en: 'Faisal Bank' },
  [ShariahSourceKey.Ostoul]: { ar: 'أسطول', en: 'Ostoul' },
  [ShariahSourceKey.Thndr]: { ar: 'ثندر', en: 'Thndr' }
};

export interface ShariahSourceOpinionDto {
  id?: number;
  stockId?: number;
  sourceKey: number;
  sourceKeyName?: string;
  /** This board's verdict for THIS stock. null = no recorded opinion ("لا يوجد رأي مسجّل"). */
  status?: string | null;
  percentage?: number | null;
  note?: string | null;
  pdfUrl?: string | null;
  sourceLastUpdated?: string | null;
  fetchedAt?: string;
  extraData?: string | null;
}

export interface RatioCheckDto {
  key?: string;
  Key?: string;
  value?: number | null;
  Value?: number | null;
  max?: number;
  Max?: number;
  hasData?: boolean;
  HasData?: boolean;
  passed?: boolean;
  Passed?: boolean;
  outcome?: string;
  Outcome?: string;
}

export interface CriterionResultDto {
  id?: string;
  Id?: string;
  nameEn?: string;
  NameEn?: string;
  passed?: boolean;
  Passed?: boolean;
  hasData?: boolean;
  HasData?: boolean;
  ratios?: RatioCheckDto[];
  Ratios?: RatioCheckDto[];
}

export interface StoredVerdictDetailsDto {
  passedCount?: number;
  PassedCount?: number;
  totalCount?: number;
  TotalCount?: number;
  viaScholarsOnly?: boolean;
  ViaScholarsOnly?: boolean;
  revenue?: number | null;
  Revenue?: number | null;
  debt?: number | null;
  Debt?: number | null;
  missing?: string[];
  Missing?: string[];
  criteria?: CriterionResultDto[];
  Criteria?: CriterionResultDto[];
}

export interface StockShariahMetricsDto {
  id?: number;
  stockId?: number;
  zakat?: number | null;
  spHaramEarningPercentage?: number | null;
  aaoifiHaramEarningPerShare?: number | null;
  haramEarningsPercentage?: number | null;
  loansPercentage?: number | null;
  fairValueValuation?: number | null;
  bookValue?: number | null;
  profit?: number | null;
  dividend?: number | null;
  dividendType?: string | null;
  coreActivityCompliant?: boolean | null;
  cashLiquidityCompliant?: boolean | null;
  haramInvestmentsCompliant?: boolean | null;
  categoryEn?: string | null;
  categoryAr?: string | null;
  sourceUpdatedAt?: string | null;
  fetchedAt?: string;
  // Extended/computed
  totalRevenues?: number | null;
  totalAssets?: number | null;
  marketCap?: number | null;
  interestBearingDebtRatio?: number | null;
  isCompliantActivity?: boolean | null;
  isCompliantAaoifi?: boolean | null;
  isCompliantSp?: boolean | null;
  activityClassification?: string | null;
}

// ── Shariah Manual Overrides ────────────────────────────────────────────────

export interface ShariahOverridesDto {
  ticker: string;
  // Feed values
  feedCoreActivityCompliant?: boolean | null;
  feedCategoryAr?: string | null;
  feedCategoryEn?: string | null;
  feedHaramRevenuePercentage?: number | null;
  feedLoansPercentage?: number | null;
  // Override values
  overrideCoreActivityCompliant?: boolean | null;
  overrideCategoryAr?: string | null;
  overrideCategoryEn?: string | null;
  overrideHaramRevenuePercentage?: number | null;
  overrideLoansPercentage?: number | null;
  // Effective values (override wins)
  effectiveCoreActivityCompliant?: boolean | null;
  effectiveCategoryAr?: string | null;
  effectiveCategoryEn?: string | null;
  effectiveHaramRevenuePercentage?: number | null;
  effectiveLoansPercentage?: number | null;
  // Source info for CoreActivityCompliant
  coreActivityCompliantSource?: 'override' | 'feed' | null;
}

export interface SaveShariahOverridesRequest {
  coreActivityCompliantOverride?: boolean | null;
  categoryArOverride?: string | null;
  categoryEnOverride?: string | null;
  haramRevenuePercentageOverride?: number | null;
  loansPercentageOverride?: number | null;
}
