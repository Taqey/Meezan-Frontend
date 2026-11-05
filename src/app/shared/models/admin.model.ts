import type { ShariahStatus } from './common.model';
import type { ShariahSourceOpinionDto, RatioCheckDto } from './shariah.model';

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

export interface RefreshMarketSnapshotsResult {
  succeeded: number;
  failed: number;
  totalTargets: number;
  duration?: string | any;
}
