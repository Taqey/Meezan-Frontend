import type { ShariahStatus, PriceComparison, ValuationConfidence } from './common.model';
import type { IndexInStockDto } from './indices.model';
import type { ShariahSourceOpinionDto, RatioCheckDto, CriterionResultDto, StoredVerdictDetailsDto, StockShariahMetricsDto } from './shariah.model';

export interface StockListItemDto {
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
  indices: string[];
  shariahStatus?: string | null;
  closingPrice?: number | null;
  changePct?: number | null;
  fairValue?: number | null;
  priceComparison?: string | null;
  fairValueDiffPct?: number | null;
  currency?: string | null;
  sectorNameAr?: string | null;
  peRatio?: number | null;
  pbRatio?: number | null;
  /** Weight within weightIndexCode (null when absent). Shown on sector cards + sortable. */
  weight?: number | null;
  /** Index code the weight belongs to: the single selected index, else "SECTORAL-INDICES". */
  weightIndexCode?: string | null;
  isCapped?: boolean | null;
  cappingFactor?: number | null;
  /** False = activity non-compliant (e.g. traditional bank). */
  coreActivityCompliant?: boolean | null;
  /** Arabic activity category name (used in non-compliance reason). */
  categoryAr?: string | null;
  /** English activity category name. */
  categoryEn?: string | null;
  /** S&P haram earning percentage (primary ratio for non-compliance reason). */
  spHaramEarningPercentage?: number | null;
  /** Loans/debt percentage (secondary ratio). */
  loansPercentage?: number | null;
  /** Purification percentage from ShariahCompliance (legacy Pct field). */
  purificationPct?: number | null;
  /** Stored verdict flag: true when Compliant ONLY via the scholars rule (green everywhere; note only on detail). */
  viaScholarsOnly?: boolean | null;
  /** Stored per-criterion results JSON (6 criteria, per-ratio pass/fail/skipped, counts). Dialog reads this directly. */
  verdictDetailsJson?: string | null;
}

export interface FairValueMethodDto {
  name: string;
  /** Null when the method produced no usable estimate — never coerced to 0. */
  value?: number | null;
  isOutlier: boolean;
}

export interface MarketDataDto {
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
  sectorNameAr?: string | null;
  sectorNameEn?: string | null;
  sectorId?: number | null;
  indices: IndexInStockDto[];
  shariahStatus?: string | null;
  /** Purification percentage — never populated for board-governed stocks. */
  shariahPct?: number | null;
  /** Empty for board-governed stocks (external opinion panel suppressed). */
  shariahOpinions: ShariahSourceOpinionDto[];
  hasMarketData?: boolean;
  /**
   * Stock overseen by its own Sharia board/committee — a plain "لجنة شرعية" and an
   * accredited "هيئة رقابة شرعية داخلية معتمدة" are the same case. Simplified display:
   * status + shariahBoardNote only (no purification %, opinions or metrics panel).
   */
  hasShariahBoard?: boolean;
  shariahBoardNote?: string | null;
  /**
   * Activity hard gate (first screening): false = نشاط الشركة غير متوافق, an automatic
   * standalone disqualification. When false the API returns no shariahOpinions, no
   * shariahPct and no shariahMetrics, and the page shows only the activity verdict.
   * Null = unknown (no metrics row).
   */
  activityCompliant?: boolean | null;
  /** Business-activity classification behind the verdict, e.g. "خدمات مالية / تخصيص". */
  activityClassification?: string | null;
  nominalValue?: number | null;
  marketValue?: number | null;
  bookValue?: number | null;
  pbRatio?: number | null;
  eps?: number | null;
  peRatio?: number | null;
  sharesOutstanding?: number | null;
  earningsGrowthRate?: number | null;
  epsGrowthRate?: number | null;
  freeCashFlow?: number | null;
  currency?: string | null;
  high?: number | null;
  low?: number | null;
  open?: number | null;
  closingPrice?: number | null;
  sourceLastUpdateText?: string | null;
  fetchedAt?: string | null;
  // Fair value
  /** Null when no trustworthy fair value exists — never rendered as 0.00. */
  fairValue?: number | null;
  /**
   * 'Cheap' | 'Expensive' | 'Fair' | 'Unavailable'; null when the stock has no
   * fair-value row at all. 'Unavailable'/null ⇒ "بيانات غير كافية لحساب القيمة العادلة".
   */
  priceComparison?: string | null;
  fairValueDiff?: number | null;
  fairValueDiffPct?: number | null;
  /** Number of methods that actually fed the fair value (0 for 'Unavailable'). */
  methodsUsedCount?: number | null;
  methodsExcludedCount?: number | null;
  valuationConfidence?: string | null;
  fairValueMethods?: FairValueMethodDto[] | null;
  // Shariah detailed metrics
  shariahMetrics?: StockShariahMetricsDto | null;
  /**
   * Why detailed financial screens are missing: "MISSING_FINANCIALS" when the
   * required inputs are absent, "NOT_CALCULATED" when screens are intentionally
   * not applied (impermissible activity or board-governed), null when data present.
   * Keeps "not applicable" and "not available" distinguishable.
   * (camelCase to match the API's camelCase JSON.)
   */
  shariahMetricsUnavailableReason?: 'MISSING_FINANCIALS' | 'NOT_CALCULATED' | string | null;
  sectorWeight?: number | null;
  isSectorWeightCapped?: boolean | null;
  sectorCappingFactor?: number | null;
  /** Stored verdict flag: true when Compliant ONLY via the scholars rule. */
  viaScholarsOnly?: boolean | null;
  /** Stored per-criterion results JSON (6 criteria). The details dialog reads this directly. */
  verdictDetailsJson?: string | null;
  /** Halal Bourse source's OWN stored verdict (Compliant/NonCompliant/Pending). Null when never computed. */
  halalStatus?: string | null;
  /** Which path produced the overall verdict (Activity/Boards/Halal/HalalScholars/EGX33/BoardsFallback/...). */
  verdictSource?: string | null;
}

export interface SupportResistanceDto {
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
  lastPrice?: number | null;
  changePct?: number | null;
  pivot?: number | null;
  r1?: number | null;
  r2?: number | null;
  s1?: number | null;
  s2?: number | null;
  fetchedAt?: string | null;
}

