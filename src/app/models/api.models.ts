export type ShariahStatus = 'Compliant' | 'NonCompliant' | 'Pending' | 'Blocked';
export type PriceComparison = 'Cheap' | 'Expensive' | 'Fair';
export type ValuationConfidence = 'None' | 'Low' | 'Medium' | 'High';

export enum ShariahSourceKey {
  HalalBourse = 1,
  Musaffa = 2,
  Kashif = 3,
  HalalInvest = 4,
  FaisalBank = 5,
  Osoul = 6,
  Thndr = 7
}

export const SHARIAH_SOURCE_NAMES: Record<number, { ar: string, en: string }> = {
  [ShariahSourceKey.HalalBourse]: { ar: 'بورصة حلال', en: 'Halal Bourse' },
  [ShariahSourceKey.Musaffa]: { ar: 'مصفّى', en: 'Musaffa' },
  [ShariahSourceKey.Kashif]: { ar: 'كاشف', en: 'Kashif' },
  [ShariahSourceKey.HalalInvest]: { ar: 'حلال إنفست', en: 'Halal Invest' },
  [ShariahSourceKey.FaisalBank]: { ar: 'بنك فيصل الإسلامي', en: 'Faisal Bank' },
  [ShariahSourceKey.Osoul]: { ar: 'أسطول', en: 'Osoul' },
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
}

export interface IndexSummaryDto {
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string | null;
  constituentsCount: number;
  lastUpdated?: string | null;
}

export interface SectorSummaryDto {
  id: number;
  nameAr: string;
  nameEn: string;
  stocksCount: number;
}

export interface IndexInStockDto {
  code: string;
  nameAr: string;
  nameEn: string;
  weight: number;
}

export interface FairValueMethodDto {
  name: string;
  value: number;
  isOutlier: boolean;
}

export interface ShariahSourceOpinionDto {
  id?: number;
  stockId?: number;
  sourceKey: number;
  sourceKeyName?: string;
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
  shariahPct?: number | null;
  shariahOpinions: ShariahSourceOpinionDto[];
  hasMarketData?: boolean;
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
  fairValue?: number | null;
  priceComparison?: string | null;
  fairValueDiff?: number | null;
  fairValueDiffPct?: number | null;
  methodsUsedCount?: number | null;
  methodsExcludedCount?: number | null;
  valuationConfidence?: string | null;
  fairValueMethods?: FairValueMethodDto[] | null;
  // Shariah detailed metrics
  shariahMetrics?: StockShariahMetricsDto | null;
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

export interface ConstituentItemDto {
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
  indices: string[];
  shariahStatus?: string | null;
  shariahOpinions: ShariahSourceOpinionDto[];
  closingPrice?: number | null;
  changePct?: number | null;
  fairValue?: number | null;
  priceComparison?: string | null;
  fairValueDiffPct?: number | null;
  weight: number;
  currency?: string | null;
  sectorNameAr?: string | null;
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
  totalConstituents: number;
  skippedDetails: SkippedRowDetail[];
  status: string;
  message: string;
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

export interface AdminStockLookupItem {
  ticker: string;
  nameAr?: string | null;
  nameEn?: string | null;
}


