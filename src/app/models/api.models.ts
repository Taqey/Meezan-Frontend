export type ShariahStatus = 'Compliant' | 'NonCompliant' | 'Pending' | 'Blocked';
/**
 * 'Unavailable' = no trustworthy fair value could be computed (zero applicable methods,
 * nothing survived the outlier fallback, or the stock's own price is missing/zero).
 * In that state fairValue / fairValueDiff / fairValueDiffPct are all null, the
 * valuationConfidence is 'None' and no Cheap/Expensive/Fair verdict may be shown.
 * A null priceComparison means the stock has no fair-value row at all — treat it as
 * 'Unavailable'.
 */
export type PriceComparison = 'Cheap' | 'Expensive' | 'Fair' | 'Unavailable';
export type ValuationConfidence = 'None' | 'Low' | 'Medium' | 'High';

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

export const INDEX_ARABIC_NAMES: Record<string, string> = {
  'EGX30': 'EGX30',
  'EGX30TR': 'عائد كلي EGX30',
  'EGX70': 'EGX70',
  'EGX100': 'EGX100',
  'EGX35-LV': 'EGX35 منخفض التذبذب',
  'Shariah': 'مؤشر الشريعة',
  'Sectoral-Indices': 'قطاعي',
  'TAMAYUZ': 'مؤشر تميز'
};

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

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

export interface IndexSummaryDto {
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string | null;
  constituentsCount: number;
  lastUpdated?: string | null;
}

export interface MarketSnapshotDto {
  kind: string;
  code: string;
  mubasherCode: string;
  value?: number | null;
  change?: number | null;
  changePct?: number | null;
  sourceDateText?: string | null;
  source?: string | null;
  fetchedAt?: string | null;
}

export interface SectorSummaryDto {
  id: number;
  nameAr: string;
  nameEn: string;
  stocksCount: number;
  /** Effective-verdict compliant count. Absent on older API responses. */
  compliantStocksCount?: number | null;
  /** 100 × compliant / total. Absent on older API responses. */
  complianceRatePct?: number | null;
  /** Mean daily change % (stocks with a value). Absent on older API responses. */
  averageChangePct?: number | null;
  /** Summed market value in EGP. Absent on older API responses. */
  marketCapTotal?: number | null;
  /** Summed market value (EGP) of compliant stocks. Absent on older API responses. */
  compliantMarketCapTotal?: number | null;
  /** Mean P/E over positive values. Absent on older API responses. */
  averagePeRatio?: number | null;
}

export interface IndexInStockDto {
  code: string;
  nameAr: string;
  nameEn: string;
  /** null when the source file for this index had no weight column */
  weight: number | null;
  isCapped?: boolean | null;
  cappingFactor?: number | null;
}

export interface FairValueMethodDto {
  name: string;
  /** Null when the method produced no usable estimate — never coerced to 0. */
  value?: number | null;
  isOutlier: boolean;
}

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

export interface MarketDataDto {
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
  sectorNameAr?: string | null;
  sectorNameEn?: string | null;
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

/** One reviewable row in the operator removal/stale checklist (read-only). */
export interface RemovalCandidateDto {
  stockId: number;
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
  lastSuccessfulUpdate?: string | null;
  sourceLastUpdateText?: string | null;
  lastClosingPrice?: number | null;
  /** StaleData | NotFoundOnSource | Deactivated */
  reason: string;
  currentIsActive: boolean;
  dataStatus: string;
  deactivatedAt?: string | null;
  deactivationReason?: string | null;
  sectorNameAr?: string | null;
}

export interface RemovalCandidatesActionResult {
  message: string;
  confirmed?: string[];
  reactivated?: string[];
  notFound?: string[];
}

export interface SelectedStockRefreshOutcomeDto {
  ticker: string;
  success: boolean;
  message?: string | null;
}

export interface RefreshSelectedStocksResult {
  success: boolean;
  totalRequested: number;
  totalFound: number;
  succeeded: number;
  failed: number;
  duration: string;
  errorSummary?: string | null;
  outcomes: SelectedStockRefreshOutcomeDto[];
}

export interface ConstituentItemDto {
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
  indices: string[];
  shariahStatus?: string | null;
  /** Empty for board-governed stocks (external opinion panel suppressed). */
  shariahOpinions: ShariahSourceOpinionDto[];
  closingPrice?: number | null;
  changePct?: number | null;
  fairValue?: number | null;
  priceComparison?: string | null;
  fairValueDiffPct?: number | null;
  /** null when the source file for this index had no weight column */
  weight: number | null;
  currency?: string | null;
  sectorNameAr?: string | null;
  /** Stock overseen by a Sharia board/committee (unified simplified display). */
  hasShariahBoard?: boolean;
  shariahBoardNote?: string | null;
}

export interface IndexConstituentsPagedResultDto {
  indexCode: string;
  indexNameAr: string;
  indexNameEn: string;
  lastUpdated?: string | null;
  items: ConstituentItemDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
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

export interface LiveProgressInfo {
  triggeredBy?: string | null;
  totalStocks: number;
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  percentComplete: number;
  currentStockTicker?: string | null;
  startedAt?: string | null;
  elapsedSeconds: number;
  estimatedSecondsRemaining?: number | null;
  jobKey?: string;
}

export interface JobProgressInfo {
  jobKey: string;
  status: 'NotRunning' | 'Running' | 'Committing' | 'Completed' | 'Failed' | string;
  live?: LiveProgressInfo | null;
  finishedAt?: string | null;
  errorReason?: string | null;
}

export interface LastRunSummary {
  runAt: string;
  finishedAt?: string | null;
  durationSeconds?: number | null;
  totalStocks: number;
  succeededStocks: number;
  failedStocks: number;
  triggeredBy: string;
  hadErrors: boolean;
}

export interface ScrapeStatusResponse {
  status: 'NotRunning' | 'Running' | 'Committing' | 'Completed' | 'Failed' | string;
  live?: LiveProgressInfo | null;
  lastRun?: LastRunSummary | null;
  jobs?: Record<string, JobProgressInfo>;
}

export interface RunCombinedScrapeResult {
  runLogId: number;
  totalStocks: number;
  succeededCount: number;
  failedCount: number;
  durationSeconds: number;
  hadErrors: boolean;
}

export interface SeedShariahResultDto {
  insertedCount: number;
  updatedCount: number;
  totalProcessed: number;
}

/**
 * Stored-PDF status for one source (FaisalBank / Ostoul).
 * Field names are camelCase to match the API response exactly.
 * status: 'exists' | 'missing-file' | 'not-found'.
 */
export interface SourcePdfStatusDto {
  sourceKey: string;
  dbPdfUrl?: string | null;
  status: 'exists' | 'missing-file' | 'not-found' | string;
  fileName?: string | null;
  sizeBytes?: number | null;
  lastModifiedUtc?: string | null;
  viewPath?: string | null;
}

export interface UploadSourcePdfResultDto {
  success: boolean;
  message?: string | null;
  sourceKey?: string | null;
  fileName?: string | null;
  storedAt?: string | null;
  reportDate?: string | null;
  uploadedAt?: string | null;
}

export interface RefreshShariahDataResult {
  success: boolean;
  message?: string | null;
  pctUpdatedCount: number;
  skippedNoValueCount: number;
  skippedNotFoundCount: number;
  stocksFullyRefreshedCount: number;
}

export interface SkippedRowDetail {
  rowNumber: number;
  identifier: string;
  reason: string;
}

export interface UploadIndexFileResultDto {
  indexCode: string;
  inserted: number;
  updated: number;
  skipped: number;
  sectorsAdded?: number;
  totalConstituents: number;
  skippedDetails: SkippedRowDetail[];
  status: string;
  message: string;
  warning?: string | null;
}

export interface ManualMarketDataUpdateRequest {
  nominalValue?: number | null;
  marketValue?: number | null;
  bookValue?: number | null;
  pbRatio?: number | null;
  eps?: number | null;
  peRatio?: number | null;
  currency?: string | null;
  high?: number | null;
  low?: number | null;
  open?: number | null;
  closingPrice?: number | null;
  sourceLastUpdateText?: string | null;
  recalculateRatios: boolean;
}

export interface ManualMarketDataUpdateResponse {
  ticker: string;
  liveUpdated: boolean;
  slowUpdated: boolean;
  fetchedAt: string;
  slowDataFetchedAt?: string | null;
  fairValue?: number | null;
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

export interface AdminStockLookupItem {
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
}

// ── Stock / Sector / Index Management (admin) ─────────────────────────────────

export interface StockManagementItem {
  id: number;
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
  sectorId?: number | null;
  sectorNameAr?: string | null;
  sectorNameEn?: string | null;
  isManual: boolean;
  isActive: boolean;
}

export interface SectorPickerItem {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface IndexPickerItem {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
}

export interface ConstituentManagementItem {
  id: number;
  stockId: number;
  ticker: string;
  nameAr?: string | null;
  indexId: number;
  indexCode: string;
  weight?: number | null;
  effectiveDate: string;
}

export interface CreateStockRequest {
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
  sectorId?: number | null;
}

export interface AssignSectorRequest {
  sectorId: number;
}

export interface AddToIndexRequest {
  weight?: number | null;
  effectiveDate?: string | null;
}

// ── Funds ────────────────────────────────────────────────────────────────

export type FundType =
  | 'balanced'
  | 'capital_preservation'
  | 'commodities'
  | 'silver'
  | 'equity'
  | 'fixed_income'
  | 'fixed_income_usd'
  | 'gold'
  | 'index'
  | 'money_market'
  | 'unknown';

export type FundRiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export type FundSortBy = 
  | 'return1m' 
  | 'return3m' 
  | 'return6m' 
  | 'return1y' 
  | 'return3y' 
  | 'aum' 
  | 'managementFee' 
  | 'totalScore' 
  | 'name' 
  | 'currentPrice';

export interface FundListItemDto {
  id: number;
  sndukId: number;
  publicId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  code: string;
  type: FundType;
  typeNameAr: string;
  typeNameEn: string;
  /** Id of the editable type row backing the effective type. */
  typeId?: number | null;
  /** Stable slug of the effective type, e.g. "equity". */
  typeSlug?: string | null;
  /** True when an operator overrode the SNDUK-derived type. */
  typeIsOverridden?: boolean;
  /** Effective classification node slug (tree). */
  classificationSlug?: string | null;
  /** Full Arabic breadcrumb path, e.g. "صندوق أسهم › صندوق مؤشر › EGX33". */
  classificationPathAr?: string | null;
  /** Assignment source: Manual | Auto | SNDUK | None. */
  classificationSource?: string | null;
  riskLevel: FundRiskLevel;
  isIslamic: boolean;
  isFeatured: boolean;
  currentPrice: number | null;
  dailyChange: number | null;
  return1M: number | null;
  return3M: number | null;
  return6M: number | null;
  return1Y: number | null;
  return3Y: number | null;
  totalScore: number | null;
  aum: number | null;
  managementFee: number | null;
  minimumInvestment: string;
  currency: string;
  assetManagerId: number | null;
  assetManagerName: string;
  assetManagerNameEn: string;
  logoUrl: string;
  localLogoPath: string;
  lastSyncedAt: string | null;
  effectiveClassification?: EffectiveClassificationDto | null;
}

export interface EffectiveClassificationDto {
  nodeId?: number | null;
  slug: string;
  nameAr: string;
  nameEn: string;
  path: string;
  rootSlug: string;
  rootNameAr: string;
  rootNameEn: string;
  leafSlug: string;
  leafNameAr: string;
  leafNameEn: string;
  source: string;
  pathSlugs: string[];
  pathNamesAr: string[];
  pathNamesEn: string[];
}

export interface FundDetailDto extends FundListItemDto {
  descriptionAr: string;
  descriptionEn: string;
  investmentStrategy: string;
  inceptionDate: string | null;
  prospectusUrl: string;
  priceHistory: FundPricePointDto[];
  analysis: FundAnalysisDto | null;
  similarFunds: FundSimilarDto[];
  categoryMemberships: FundCategoryMembershipDto[];
}

export interface FundPricePointDto {
  date: string;
  price: number;
  change: number | null;
  performance: number | null;
}

export interface FundAnalysisDto {
  performanceScore: number | null;
  riskScore: number | null;
  costScore: number | null;
  stabilityScore: number | null;
  diversificationScore: number | null;
  totalScore: number | null;
  cagr: number | null;
  alpha: number | null;
  volatility: number | null;
  consistency: number | null;
  maxDrawdown: number | null;
  sharpeRatio: number | null;
  performanceExplanationAr: string;
  performanceExplanationEn: string;
  riskExplanationAr: string;
  riskExplanationEn: string;
  costExplanationAr: string;
  costExplanationEn: string;
  stabilityExplanationAr: string;
  stabilityExplanationEn: string;
  diversificationExplanationAr: string;
  diversificationExplanationEn: string;
  calculatedAt: string;
}

export interface FundSimilarDto {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  /** Local logo path (served from the API host) when a file was downloaded. */
  localLogoPath?: string | null;
  /** Original SNDUK/Supabase logo URL used as fallback. */
  logoUrl?: string | null;
  typeNameAr?: string | null;
  typeNameEn?: string | null;
  typeSlug?: string | null;
  classificationPathAr?: string | null;
  effectiveClassification?: EffectiveClassificationDto | null;
}

/** One row of the editable fund-type catalog (powers the public type dropdown). */
export interface FundTypeOptionDto {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  displayOrder: number;
}

/** Admin view of a fund type, including soft-delete and audit fields. */
export interface FundTypeDefinition {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  displayOrder: number;
  isVisible: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  /** Computed effective fund count (returned in list endpoint). */
  fundCount?: number;
}

/** Chip shown inside the type-funds panel. */
export interface FundCategoryChip {
  id: number;
  slug: string;
  nameAr: string;
}

/** Rich fund row inside a type's fund list (GET /api/admin/funds/types/{id}/funds). */
export interface AdminTypeFundRow {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  assetManagerName: string;
  effectiveTypeId: number | null;
  effectiveTypeSlug: string;
  effectiveTypeNameAr: string;
  /** 'SNDUK' | 'يدوي' | 'تلقائي - يتبع مؤشر' */
  source: string;
  originalSndukSlug: string | null;
  originalSndukNameAr: string | null;
  overrideTypeId: number | null;
  categories: FundCategoryChip[];
}

export interface FundTypeChangeLog {
  id: number;
  fundId: number | null;
  fundTypeDefinitionId: number | null;
  action: number;
  performedBy: string;
  reason: string | null;
  createdAt: string;
  fund?: { id: number; code: string; nameAr: string } | null;
  definition?: { id: number; slug: string; nameAr: string; nameEn: string } | null;
}

export interface CreateFundTypeRequest {
  nameAr: string;
  nameEn: string;
  slug?: string | null;
  icon?: string | null;
  color?: string | null;
  displayOrder: number;
  isVisible: boolean;
}

export interface UpdateFundTypeRequest {
  nameAr?: string | null;
  nameEn?: string | null;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number | null;
  isVisible?: boolean | null;
}

export interface MergeFundTypesRequest {
  sourceId: number;
  targetId: number;
}

export interface FundCategoryDto {
  id: number;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string;
  color: string;
  isAutoDerived: boolean;
  displayOrder: number;
}

export interface FundCategoryMembershipDto {
  categoryId: number;
  categoryNameAr: string;
  categoryNameEn: string;
  categorySlug: string;
  source: string; // "Auto" | "Manual" | "Excluded" | "None"
}

export interface FundListFilter {
  search?: string;
  type?: string;
  /** Tree node slug + descendants (e.g. node=equity includes index/sector/active/unclassified funds). */
  node?: string;
  /** Tree node slug + descendants (any level). */
  subType?: string;
  /** Tree node slug, direct assignment only. */
  leaf?: string;
  riskLevel?: string;
  assetManagerId?: number;
  isIslamic?: boolean;
  isFeatured?: boolean;
  categoryId?: number;
  minManagementFee?: number;
  maxManagementFee?: number;
  minInvestment?: number;
  maxInvestment?: number;
  sortBy?: FundSortBy;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/** One node of the public classification tree (visible nodes that contain funds). */
export interface FundClassificationTreeNode {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  level: number;
  parentSlug: string | null;
  displayOrder: number;
  childrenLabelAr: string;
  childrenLabelEn: string;
  directFundCount: number;
  totalFundCount: number;
  hasAutoRule: boolean;
}

export interface FundAssetManagerOption {
  id: number;
  nameAr: string;
  nameEn: string;
  fundCount: number;
}

/** One node of the admin classification tree (all nodes + counts + audit fields). */
export interface AdminClassificationNode {
  id: number;
  parentId: number | null;
  level: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  displayOrder: number;
  isVisible: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string;
  requiresChildSelection: boolean;
  childrenLabelAr: string;
  childrenLabelEn: string;
  autoRuleJson: string;
  autoClassificationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  directCount: number;
  totalCount: number;
}

export interface ClassificationNodeFundRow {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  assetManagerName: string;
  path: string;
  source: string;
  reason: string;
  needsReview: boolean;
  isManual: boolean;
}

export interface ClassificationReviewRow {
  fundId: number;
  code: string;
  nameAr: string;
  nameEn: string;
  assetManagerName: string;
  description: string | null;
  investmentStrategy: string | null;
  reason: string;
  path: string;
  source: string;
  isManual: boolean;
}

export interface ClassificationReview {
  unclassifiedCount: number;
  conflictingCount: number;
  missingChildCount: number;
  unclassifiedEquity: ClassificationReviewRow[];
  conflicting: ClassificationReviewRow[];
  missingChild: ClassificationReviewRow[];
}

export interface ReclassifyResult {
  processed: number;
  moved: number;
  remaining: number;
  failed: number;
  movedCodes: string[];
  errors: string[];
}

export interface ClassificationMigrationChanged {
  code: string;
  name: string;
  oldPath: string;
  newPath: string;
  reason: string;
}

export interface ClassificationMigrationReport {
  seedPerformed: boolean;
  backupPerformed: boolean;
  backupRows: number;
  changed: ClassificationMigrationChanged[];
  unclassifiedEquity: string[];
  commoditiesRenamed: number;
  commoditiesFunds: string[];
  notes: string[];
}

export interface CreateClassificationNodeRequest {
  parentId?: number | null;
  slug?: string | null;
  nameAr: string;
  nameEn: string;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number | null;
  isVisible?: boolean | null;
  requiresChildSelection?: boolean | null;
  childrenLabelAr?: string | null;
  childrenLabelEn?: string | null;
  autoRuleJson?: string | null;
  autoClassificationEnabled?: boolean | null;
  fundDisposition?: string | null;
}

export interface UpdateClassificationNodeRequest {
  slug?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number | null;
  isVisible?: boolean | null;
  requiresChildSelection?: boolean | null;
  childrenLabelAr?: string | null;
  childrenLabelEn?: string | null;
  autoRuleJson?: string | null;
  autoClassificationEnabled?: boolean | null;
}

export interface FundPagedResultDto {
  items: FundListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Admin Fund Models
export interface FundSyncSettings {
  id: number;
  isEnabled: boolean;
  runTimeCairo: string; // HH:mm format
  preventOverlap: boolean;
  requestDelaySeconds: number;
  maxRetries: number;
  retryBackoffSeconds: number;
  updatedAt: string;
  updatedBy: string;
}

export interface FundSyncLog {
  id: number;
  runAt: string;
  finishedAt: string | null;
  status: 'running' | 'success' | 'partial' | 'failed';
  mode?: 'Prices' | 'Full' | string;
  totalFunds: number;
  updatedFunds: number;
  failedFunds: number;
  skippedFunds: number;
  errorSummary: string | null;
  triggeredBy: string;
  durationSeconds: number;
}

export interface FundSyncStatusDto {
  isRunning: boolean;
  mode?: string | null;
  triggeredBy?: string | null;
  startedAtUtc?: string | null;
  totalFunds: number;
  processedCount: number;
  updatedCount: number;
  failedCount: number;
  currentFundCode?: string | null;
  currentPhase?: string | null;
  finishedAtUtc?: string | null;
  lastResultSummary?: string | null;
  error?: string | null;
}

export interface FundPriceSyncResultDto {
  totalSndukFunds: number;
  updatedFunds: number;
  missingFromSndukCount: number;
  newInSndukCount: number;
  durationSeconds: number;
  syncedAtUtc: string;
  message?: string | null;
}

export interface FundSyncLogDetail {
  id: number;
  fundSyncLogId: number;
  fundId: number;
  fundCode: string;
  status: 'success' | 'failed' | 'skipped';
  errorMessage: string | null;
  attemptedAt: string;
}

export interface FundSyncRunRequest {
  triggeredBy?: string;
}

export interface FundSyncSettingsUpdateRequest {
  isEnabled?: boolean;
  runTimeCairo?: string;
  preventOverlap?: boolean;
  requestDelaySeconds?: number;
  maxRetries?: number;
  retryBackoffSeconds?: number;
  autoClassificationEnabled?: boolean;
  fullSyncScheduleEnabled?: boolean;
  fullSyncRunTimeCairo?: string;
}

export interface FundCategory {
  id: number;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string;
  color: string;
  isAutoDerived: boolean;
  autoRuleJson: string;
  isVisible: boolean;
  displayOrder: number;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface FundCategoryOverride {
  id: number;
  fundId: number;
  categoryId: number;
  action: 'include' | 'exclude';
  createdAt: string;
  createdBy: string;
}

export interface CategoryChangeAction {
  action: 'include' | 'exclude' | 'reset';
}

export interface CreateCategoryRequest {
  nameAr: string;
  nameEn: string;
  slug?: string;
  icon?: string;
  color?: string;
  isAutoDerived?: boolean;
  autoRuleJson?: string;
  isVisible?: boolean;
  displayOrder?: number;
}

export interface UpdateCategoryRequest {
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  icon?: string;
  color?: string;
  isVisible?: boolean;
  displayOrder?: number;
  autoRuleJson?: string;
}

export interface MergeCategoriesRequest {
  sourceCategoryId: number;
  targetCategoryId: number;
}

export interface CategoryFundMember {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  source: string; // "Auto" | "Manual"
  reason: string;
}

export interface FundCategoryChangeLog {
  id: number;
  fundId: number | null;
  categoryId: number;
  action: string;
  performedBy: string;
  reason: string | null;
  createdAt: string;
  fund?: { id: number; code: string; nameAr: string };
  category?: { id: number; nameAr: string; nameEn: string };
}

export interface FundCategoryChangeLogFilter {
  fundId?: number;
  categoryId?: number;
  action?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface RefreshMarketSnapshotsResult {
  succeeded: number;
  failed: number;
  totalTargets: number;
  duration?: string | any;
}


