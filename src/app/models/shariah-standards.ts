/**
 * Single source of truth for Shariah quantitative screening standards.
 *
 * Every standard carries an Arabic name (primary label), an English name shown
 * alongside it, an Arabic subtitle, and the four quantitative thresholds
 * (percentages). All comparisons are "ratio ≤ max" (inclusive).
 *
 * Thresholds must exist in this one place only — the comparison page, the
 * Bourse Halal card upgrade and the details dialog all import from here.
 */

export type ShariahCriterionKey =
  | 'prohibitedRevenue'
  | 'debt'
  | 'prohibitedInvestments'
  | 'cash';

export interface ShariahCriterionLabel {
  ar: string;
  en: string;
}

/** Display order of the four criteria (table columns, dialog rows). */
export const CRITERION_ORDER: readonly ShariahCriterionKey[] = [
  'prohibitedRevenue',
  'debt',
  'prohibitedInvestments',
  'cash'
];

export const CRITERION_LABELS: Record<ShariahCriterionKey, ShariahCriterionLabel> = {
  prohibitedRevenue: { ar: 'نسبة الإيرادات المحرمة', en: 'Prohibited revenue' },
  debt: { ar: 'نسبة القروض', en: 'Debt/Loans' },
  prohibitedInvestments: { ar: 'نسبة الاستثمارات المحرمة', en: 'Prohibited investments' },
  cash: { ar: 'نسبة السيولة النقدية', en: 'Cash/Liquidity' }
};

export interface ShariahStandard {
  id: string;
  nameAr: string;
  nameEn: string;
  subtitleAr: string;
  /** Max prohibited-revenue % (inclusive). */
  prohibitedRevenueMax: number;
  /** Max interest-bearing-debt % (inclusive). */
  debtMax: number;
  /** Max prohibited-investments % (inclusive). */
  prohibitedInvestmentsMax: number;
  /** Max cash/liquid-assets % (inclusive). */
  cashMax: number;
}

export const SHARIAH_STANDARDS: readonly ShariahStandard[] = [
  {
    id: 'egx33',
    nameAr: 'مؤشر EGX 33 للشريعة',
    nameEn: 'EGX 33',
    subtitleAr: 'بورصة مصر',
    prohibitedRevenueMax: 10,
    debtMax: 33,
    prohibitedInvestmentsMax: 33,
    cashMax: 70
  },
  {
    id: 'dfm',
    nameAr: 'سوق دبي المالي',
    nameEn: 'DFM',
    subtitleAr: 'سوق دبي المالي',
    prohibitedRevenueMax: 10,
    debtMax: 30,
    prohibitedInvestmentsMax: 30,
    cashMax: 70
  },
  {
    id: 'aaoifi',
    nameAr: 'أيوفي (هيئة المحاسبة والمراجعة للمؤسسات المالية الإسلامية)',
    nameEn: 'AAOIFI',
    subtitleAr: 'معيار دولي',
    prohibitedRevenueMax: 5,
    debtMax: 30,
    prohibitedInvestmentsMax: 30,
    cashMax: 70
  },
  {
    id: 'sp',
    nameAr: 'إس آند بي للشريعة',
    nameEn: 'S&P Shariah',
    subtitleAr: 'معيار دولي',
    prohibitedRevenueMax: 5,
    debtMax: 33,
    prohibitedInvestmentsMax: 33,
    cashMax: 70
  },
  {
    id: 'klsi',
    nameAr: 'مؤشر كوالالمبور للشريعة',
    nameEn: 'KLSI',
    subtitleAr: 'بورصة ماليزيا',
    prohibitedRevenueMax: 20,
    debtMax: 33,
    prohibitedInvestmentsMax: 33,
    cashMax: 70
  }
];

/**
 * Debt ceiling (%) from individual scholars' fatwas (فتاوى علماء أفراد):
 * permits investing in companies with debt up to 50%. Not adopted by most
 * institutions — shown as a separate informational row, never counted in
 * passedCount/totalCount.
 */
export const scholarsDebtMax = 50;

/** The stock's own quantitative ratios (percentages), as shown in the
 *  "AAOIFI & S&P detailed ratios" section. Missing/unknown ratios are
 *  null/undefined — never 0. */
export interface StockRatios {
  prohibitedRevenue?: number | null;
  debt?: number | null;
  prohibitedInvestments?: number | null;
  cash?: number | null;
}

export interface CriterionEvaluation {
  /** The stock's ratio, or null when no data is available. */
  value: number | null;
  /** The standard's threshold for this criterion. */
  max: number;
  /** value ≤ max. Always false when there is no data. */
  passed: boolean;
  /** False when the ratio is missing/null — excluded from pass/fail decisions. */
  hasData: boolean;
}

export interface StandardEvaluation {
  standard: ShariahStandard;
  criteria: Record<ShariahCriterionKey, CriterionEvaluation>;
  /** All AVAILABLE criteria pass. False when the standard has no data at all. */
  passed: boolean;
  /** True when at least one criterion has data. */
  hasData: boolean;
}

export interface StandardsEvaluation {
  standards: StandardEvaluation[];
  /** Standards fully passing (all available criteria pass). */
  passedCount: number;
  /** Standards with at least one available criterion (no-data standards excluded). */
  totalCount: number;
}

function criterionMax(standard: ShariahStandard, key: ShariahCriterionKey): number {
  switch (key) {
    case 'prohibitedRevenue': return standard.prohibitedRevenueMax;
    case 'debt': return standard.debtMax;
    case 'prohibitedInvestments': return standard.prohibitedInvestmentsMax;
    case 'cash': return standard.cashMax;
  }
}

function normalizeRatio(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

/**
 * Pure function: compares the stock's own ratios against every standard.
 *
 * - Comparison is "value ≤ max" (inclusive) per criterion.
 * - A missing/null ratio marks that criterion as "no data": it is excluded
 *   from the pass/fail decision and must render as "—" in the UI. Missing data
 *   is NEVER treated as 0.
 * - A standard passes when all of its AVAILABLE criteria pass.
 * - A standard with no available criteria at all is "no data" (passed=false,
 *   hasData=false) and is excluded from passedCount/totalCount.
 */
export function evaluateStandards(stockRatios: StockRatios): StandardsEvaluation {
  const standards: StandardEvaluation[] = SHARIAH_STANDARDS.map((standard) => {
    const criteria = {} as Record<ShariahCriterionKey, CriterionEvaluation>;
    for (const key of CRITERION_ORDER) {
      const value = normalizeRatio(stockRatios[key]);
      const max = criterionMax(standard, key);
      const hasData = value !== null;
      criteria[key] = { value, max, passed: hasData && value <= max, hasData };
    }
    const available = CRITERION_ORDER.map((k) => criteria[k]).filter((c) => c.hasData);
    const hasData = available.length > 0;
    return {
      standard,
      criteria,
      passed: hasData && available.every((c) => c.passed),
      hasData
    };
  });

  return {
    standards,
    passedCount: standards.filter((s) => s.passed).length,
    totalCount: standards.filter((s) => s.hasData).length
  };
}

/**
 * Overall Bourse Halal rule (pure, unit-testable): applies ONLY when the card's
 * effective status is doubtful. The stock is treated as compliant overall when
 * it passes AT LEAST ONE standard with data. Failing all standards (or having
 * no data at all) keeps it doubtful.
 */
export function shouldUpgradeDoubtfulToCompliant(
  isDoubtful: boolean,
  evaluation: StandardsEvaluation
): boolean {
  return isDoubtful && evaluation.totalCount > 0 && evaluation.passedCount > 0;
}

// ── Effective per-source status (single place) ─────────────────────────
// Every consumer — the opinion cards, the internal-verdict badge and the
// summary counters — must read EffectiveSourceStatus.effectiveStatus and never
// the raw stored status directly.

/** Normalized status vocabulary shared by the selector and the components. */
export type NormalizedStatus = 'compliant' | 'noncompliant' | 'doubtful' | 'pending' | 'blocked' | '';

export function normalizeStatusValue(status?: string | null): NormalizedStatus {
  const s = (status || '').toLowerCase().replace(/[-_ ]/g, '');
  if (s === 'compliant') return 'compliant';
  if (s === 'noncompliant') return 'noncompliant';
  if (s === 'doubtful') return 'doubtful';
  if (s === 'pending') return 'pending';
  if (s === 'blocked') return 'blocked';
  return '';
}

/** Raw per-source input for effective-status resolution. */
export interface SourceStatusInput {
  sourceKey: number;
  status?: string | null;
  percentage?: number | null;
  noOpinion: boolean;
}

export interface EffectiveSourceStatus {
  /** Display status before the standards upgrade (HalalBourse pct rule applied). */
  rawDisplayStatus: string | null;
  /** Status every consumer (cards, verdict, counters) must read. */
  effectiveStatus: string | null;
  /** True when the standards upgrade flipped this source to compliant. */
  upgraded: boolean;
}

/**
 * Bourse Halal display status: a stored "compliant" with percentage < 100
 * (or missing) is shown as doubtful (مشكوك). Anything else passes through.
 */
export function halalBourseDisplayStatus(
  status?: string | null,
  percentage?: number | null
): string | null {
  if (normalizeStatusValue(status) === 'compliant') {
    const pct = percentage == null ? null : Number(percentage);
    if (pct == null || isNaN(pct) || pct < 100) return 'doubtful';
  }
  return status ?? null;
}

/**
 * ONE effective status per source. For Bourse Halal: a doubtful display status
 * that passes at least one quantitative standard becomes "Compliant";
 * otherwise it equals the display status. All other sources keep their raw
 * status. Extra fields on the input objects (notes, dates, pdf urls) are
 * preserved untouched.
 */
export function getEffectiveSourceStatuses<T extends SourceStatusInput>(
  sources: readonly T[],
  evaluation: StandardsEvaluation,
  halalBourseKey: number
): Array<T & EffectiveSourceStatus> {
  return sources.map((src) => {
    if (src.noOpinion) {
      return { ...src, rawDisplayStatus: null, effectiveStatus: null, upgraded: false };
    }
    const isHalalBourse = Number(src.sourceKey) === halalBourseKey;
    const raw = isHalalBourse
      ? halalBourseDisplayStatus(src.status, src.percentage)
      : (src.status ?? null);
    const upgraded = isHalalBourse
      && shouldUpgradeDoubtfulToCompliant(normalizeStatusValue(raw) === 'doubtful', evaluation);
    return {
      ...src,
      rawDisplayStatus: raw,
      effectiveStatus: upgraded ? 'Compliant' : raw,
      upgraded
    };
  });
}

/**
 * Internal verdict from effective statuses: at least one effective "compliant"
 * → 'Compliant'; otherwise the stored fallback (existing behavior for every
 * other case: all red, pending, no data, …).
 */
export function resolveInternalVerdict(
  effectiveStatuses: ReadonlyArray<string | null | undefined>,
  fallback: string | null | undefined
): string | null {
  if (effectiveStatuses.some((s) => normalizeStatusValue(s) === 'compliant')) return 'Compliant';
  return fallback ?? null;
}
