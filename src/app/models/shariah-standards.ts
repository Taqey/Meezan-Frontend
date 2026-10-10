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

/** Arabic label for the individual-scholars criterion. */
export const SCHOLARS_STANDARD_NAME_AR = 'فتاوى علماء أفراد';
/** English label for the individual-scholars criterion. */
export const SCHOLARS_STANDARD_NAME_EN = 'Individual Scholars';

/**
 * Arabic verdict label for a stock that passes only the individual-scholars
 * debt threshold (≤ 50%) but fails all five institutional standards.
 */
export const SCHOLARS_COMPLIANT_VERDICT = 'متوافق (بحسب بعض العلماء الأفراد)';

/**
 * Evaluates only the scholars' debt criterion: debt ≤ scholarsDebtMax.
 * Returns true if the debt ratio is available AND within the 50% ceiling.
 * Returns false if debt is null/undefined (no data) or exceeds the ceiling.
 */
export function evaluateScholarsDebt(debtPct: number | null | undefined): boolean {
  if (debtPct == null || isNaN(Number(debtPct))) return false;
  return Number(debtPct) <= scholarsDebtMax;
}

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

/**
 * Full four-tier verdict (replaces the old doubtful bucket):
 *
 * 1. passes ≥1 of 5 institutional standards   → 'Compliant'
 * 2. fails all 5 but debt ≤ 50% (scholars)    → SCHOLARS_COMPLIANT_VERDICT
 * 3. fails everything with data                → 'NonCompliant'
 * 4. no data at all                            → 'Pending' (قيد المراجعة)
 *
 * Call this instead of resolveInternalVerdict on the stock-detail page to
 * eliminate the doubtful display entirely.
 */
export function resolveVerdictWithScholars(
  evaluation: StandardsEvaluation,
  debtPct: number | null | undefined
): string {
  // Tier 1: passes at least one institutional standard
  if (evaluation.passedCount > 0) return 'Compliant';
  // Tier 2: no data for any standard → pending
  if (evaluation.totalCount === 0) return 'Pending';
  // Tier 3: fails all standards but the scholars debt threshold passes
  if (evaluateScholarsDebt(debtPct)) return SCHOLARS_COMPLIANT_VERDICT;
  // Tier 4: fails everything
  return 'NonCompliant';
}

// ── Non-compliance reason helper ────────────────────────────────────────────

export interface NonComplianceReasonInput {
  coreActivityCompliant?: boolean | null;
  categoryAr?: string | null;
  spHaramEarningPercentage?: number | null;
  loansPercentage?: number | null;
}

/**
 * Builds an array of compact Arabic reason strings for a non-compliant stock.
 *
 * Order: activity first, then financial ratios.
 * Thresholds are read from SHARIAH_STANDARDS; the loosest standard that still
 * caused non-compliance is not resolved here — instead we show the actual values
 * and the KLSI limit (20 % revenue, 33 % debt) which is the widest threshold
 * in the backend upgrade logic (matching StockRepository.cs).
 *
 * Returns an empty array when the stock is not explicitly non-compliant.
 */
export function getNonComplianceReasons(input: NonComplianceReasonInput): string[] {
  const reasons: string[] = [];

  // 1. Activity non-compliance
  if (input.coreActivityCompliant === false) {
    const cat = input.categoryAr?.trim();
    reasons.push(
      cat
        ? `السبب: النشاط الأساسي غير متوافق (${cat})`
        : 'السبب: النشاط الأساسي غير متوافق'
    );
  }

  // 2. Financial ratio non-compliance (only if activity is fine)
  // Use the loosest revenue/debt thresholds (KLSI: 20/33) because the backend
  // upgrades a doubtful stock to compliant only when ALL standards' thresholds
  // pass; a stock that fails even KLSI is flagged non-compliant.
  const revenueMax = Math.max(...SHARIAH_STANDARDS.map((s) => s.prohibitedRevenueMax)); // 20
  const debtMax    = Math.max(...SHARIAH_STANDARDS.map((s) => s.debtMax));              // 33

  const ratioReasons: string[] = [];

  const rev = input.spHaramEarningPercentage;
  if (rev != null && rev > revenueMax) {
    ratioReasons.push(
      `تجاوز نسبة الإيرادات المحرمة (${rev.toFixed(0)}% — الحد الأقصى ${revenueMax}%)`
    );
  }

  const debt = input.loansPercentage;
  if (debt != null && debt > debtMax) {
    ratioReasons.push(
      `تجاوز نسبة القروض (${debt.toFixed(0)}% — الحد الأقصى ${debtMax}%)`
    );
  }

  if (ratioReasons.length > 0) {
    reasons.push('السبب: ' + ratioReasons.join(' · '));
  }

  return reasons;
}

/**
 * Checks whether a stock fails Shariah compliance due to impermissible core activity.
 */
export function hasActivityNonCompliance(input: { coreActivityCompliant?: boolean | null }): boolean {
  return input.coreActivityCompliant === false;
}

/**
 * Checks whether a stock fails Shariah compliance due to financial ratios exceeding
 * maximum permissible limits (read from SHARIAH_STANDARDS, identical to the card reason badge).
 */
export function hasRatioNonCompliance(input: {
  spHaramEarningPercentage?: number | null;
  loansPercentage?: number | null;
}): boolean {
  const revenueMax = Math.max(...SHARIAH_STANDARDS.map((s) => s.prohibitedRevenueMax)); // 20
  const debtMax    = Math.max(...SHARIAH_STANDARDS.map((s) => s.debtMax));              // 33

  const rev = input.spHaramEarningPercentage;
  if (rev != null && rev > revenueMax) return true;

  const debt = input.loansPercentage;
  if (debt != null && debt > debtMax) return true;

  return false;
}

/**
 * Determines whether a stock matches the selected nonComplianceType filter.
 * - 'activity': coreActivityCompliant === false
 * - 'ratios': at least one ratio exceeds the max limit
 * - A stock failing both will match and appear under both options.
 * - Empty / 'all': matches all stocks.
 */
export function matchesNonComplianceType(
  stock: {
    coreActivityCompliant?: boolean | null;
    spHaramEarningPercentage?: number | null;
    loansPercentage?: number | null;
  },
  type: string
): boolean {
  if (!type) return true;
  if (type === 'activity') return hasActivityNonCompliance(stock);
  if (type === 'ratios') return hasRatioNonCompliance(stock);
  return true;
}

