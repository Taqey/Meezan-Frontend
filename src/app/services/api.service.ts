import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  IndexConstituentsPagedResultDto,
  IndexSummaryDto,
  MarketDataDto,
  MarketSnapshotDto,
  PagedResult,
  RefreshShariahDataResult,
  RunCombinedScrapeResult,
  ScrapeStatusResponse,
  SectorSummaryDto,
  SeedShariahResultDto,
  SourcePdfStatusDto,
  StockListItemDto,
  SupportResistanceDto,
  UploadIndexFileResultDto,
  UploadSourcePdfResultDto,
  ManualMarketDataUpdateRequest,
  ManualMarketDataUpdateResponse,
  AdminStockLookupItem,
  RemovalCandidateDto,
  RemovalCandidatesActionResult,
  RefreshSelectedStocksResult,
  StockManagementItem,
  SectorPickerItem,
  IndexPickerItem,
  ConstituentManagementItem,
  CreateStockRequest,
  AssignSectorRequest,
  AddToIndexRequest,
  ShariahOverridesDto,
  SaveShariahOverridesRequest
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'https://meezaan.runasp.net';
  constructor(private http: HttpClient) {}

  // ── Indices ────────────────────────────────────────────────────────
  getIndices(): Observable<IndexSummaryDto[]> {
    return this.http.get<IndexSummaryDto[]>(`${this.baseUrl}/api/indices`);
  }

  // ── Sectors ────────────────────────────────────────────────────────
  getSectors(): Observable<SectorSummaryDto[]> {
    return this.http.get<SectorSummaryDto[]>(`${this.baseUrl}/api/sectors`);
  }

  getIndexConstituents(
    code: string,
    params?: {
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortDir?: string;
      search?: string;
      shariahStatus?: string;
      shariahStatuses?: string[];
      priceComparison?: string;
      minCompliantSources?: number;
      minPeRatio?: number;
      maxPeRatio?: number;
      minPbRatio?: number;
      maxPbRatio?: number;
    }
  ): Observable<IndexConstituentsPagedResultDto> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
      if (params.pageSize !== undefined) httpParams = httpParams.set('pageSize', params.pageSize);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.shariahStatus) httpParams = httpParams.set('shariahStatus', params.shariahStatus);
      if (params.shariahStatuses && params.shariahStatuses.length > 0) {
        for (const status of params.shariahStatuses) {
          httpParams = httpParams.append('shariahStatuses', status);
        }
      }
      if (params.priceComparison) httpParams = httpParams.set('priceComparison', params.priceComparison);
      if (params.minCompliantSources !== undefined) httpParams = httpParams.set('minCompliantSources', params.minCompliantSources);
      if (params.minPeRatio !== undefined && params.minPeRatio !== null) httpParams = httpParams.set('minPeRatio', params.minPeRatio);
      if (params.maxPeRatio !== undefined && params.maxPeRatio !== null) httpParams = httpParams.set('maxPeRatio', params.maxPeRatio);
      if (params.minPbRatio !== undefined && params.minPbRatio !== null) httpParams = httpParams.set('minPbRatio', params.minPbRatio);
      if (params.maxPbRatio !== undefined && params.maxPbRatio !== null) httpParams = httpParams.set('maxPbRatio', params.maxPbRatio);
    }
    return this.http.get<IndexConstituentsPagedResultDto>(`${this.baseUrl}/api/indices/${code}/constituents`, {
      params: httpParams
    });
  }

  uploadIndexFile(code: string, file: File): Observable<UploadIndexFileResultDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<UploadIndexFileResultDto>(`${this.baseUrl}/api/indices/${code}/upload`, formData);
  }

  // ── Stocks ─────────────────────────────────────────────────────────
  getStocks(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: string;
    search?: string;
    indexCode?: string;
    indexCodes?: string[];
    sectorId?: number;
    shariahStatus?: string;
    shariahStatuses?: string[];
    priceComparison?: string;
    minCompliantSources?: number;
    minPeRatio?: number;
    maxPeRatio?: number;
    minPbRatio?: number;
    maxPbRatio?: number;
  }): Observable<PagedResult<StockListItemDto>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
      if (params.pageSize !== undefined) httpParams = httpParams.set('pageSize', params.pageSize);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.indexCode) httpParams = httpParams.set('indexCode', params.indexCode);
      if (params.indexCodes && params.indexCodes.length > 0) {
        for (const code of params.indexCodes) {
          httpParams = httpParams.append('indexCodes', code);
        }
      }
      if (params.sectorId !== undefined) httpParams = httpParams.set('sectorId', params.sectorId);
      if (params.shariahStatus) httpParams = httpParams.set('shariahStatus', params.shariahStatus);
      if (params.shariahStatuses && params.shariahStatuses.length > 0) {
        for (const status of params.shariahStatuses) {
          httpParams = httpParams.append('shariahStatuses', status);
        }
      }
      if (params.priceComparison) httpParams = httpParams.set('priceComparison', params.priceComparison);
      if (params.minCompliantSources !== undefined) httpParams = httpParams.set('minCompliantSources', params.minCompliantSources);
      if (params.minPeRatio !== undefined && params.minPeRatio !== null) httpParams = httpParams.set('minPeRatio', params.minPeRatio);
      if (params.maxPeRatio !== undefined && params.maxPeRatio !== null) httpParams = httpParams.set('maxPeRatio', params.maxPeRatio);
      if (params.minPbRatio !== undefined && params.minPbRatio !== null) httpParams = httpParams.set('minPbRatio', params.minPbRatio);
      if (params.maxPbRatio !== undefined && params.maxPbRatio !== null) httpParams = httpParams.set('maxPbRatio', params.maxPbRatio);
    }
    return this.http.get<PagedResult<StockListItemDto>>(`${this.baseUrl}/api/stocks`, {
      params: httpParams
    });
  }

  getMarketData(ticker: string): Observable<MarketDataDto> {
    return this.http.get<MarketDataDto>(`${this.baseUrl}/api/stocks/${ticker}/market-data`);
  }

  /** Latest-good published quotes (indices + sectors). Empty when never fetched. */
  getMarketSnapshots(): Observable<MarketSnapshotDto[]> {
    return this.http.get<MarketSnapshotDto[]>(`${this.baseUrl}/api/market-snapshots`);
  }

  getSupportResistance(ticker: string): Observable<SupportResistanceDto> {
    return this.http.get<SupportResistanceDto>(`${this.baseUrl}/api/stocks/${ticker}/support-resistance`);
  }

  // ── Scraping ───────────────────────────────────────────────────────
  runScraping(bucket: 'LiveDaily' | 'SlowQuarterly' = 'LiveDaily'): Observable<RunCombinedScrapeResult> {
    return this.http.post<RunCombinedScrapeResult>(`${this.baseUrl}/api/scraping/run?bucket=${bucket}`, {});
  }

  getScrapingStatus(): Observable<ScrapeStatusResponse> {
    return this.http.get<ScrapeStatusResponse>(`${this.baseUrl}/api/scraping/status`);
  }

  // ── Removal / stale-stock review checklist ────────────────────────
  getRemovalCandidates(): Observable<RemovalCandidateDto[]> {
    return this.http.get<RemovalCandidateDto[]>(`${this.baseUrl}/api/scraping/removal-candidates`);
  }

  confirmRemovals(tickers: string[], reason?: string): Observable<RemovalCandidatesActionResult> {
    return this.http.post<RemovalCandidatesActionResult>(
      `${this.baseUrl}/api/scraping/removal-candidates/confirm`,
      { tickers, reason: reason || null }
    );
  }

  refreshSelectedStocks(tickers: string[]): Observable<RefreshSelectedStocksResult> {
    return this.http.post<RefreshSelectedStocksResult>(
      `${this.baseUrl}/api/scraping/removal-candidates/refresh`,
      { tickers }
    );
  }

  reactivateSelectedStocks(tickers: string[]): Observable<RemovalCandidatesActionResult> {
    return this.http.post<RemovalCandidatesActionResult>(
      `${this.baseUrl}/api/scraping/removal-candidates/reactivate`,
      { tickers }
    );
  }

  // ── Admin Market Data ──────────────────────────────────────────────
  getAdminStocksLookup(): Observable<AdminStockLookupItem[]> {
    return this.http.get<AdminStockLookupItem[]>(`${this.baseUrl}/api/admin/market-data/stocks`);
  }

  updateMarketData(ticker: string, request: ManualMarketDataUpdateRequest): Observable<ManualMarketDataUpdateResponse> {
    return this.http.patch<ManualMarketDataUpdateResponse>(`${this.baseUrl}/api/admin/market-data/${encodeURIComponent(ticker)}`, request);
  }

  // ── Shariah ────────────────────────────────────────────────────────
  getSourcePdfStatus(): Observable<SourcePdfStatusDto[]> {
    return this.http.get<SourcePdfStatusDto[]>(`${this.baseUrl}/api/shariah/source-pdfs/status`);
  }

  uploadSourcePdf(sourceKey: string, file: File, reportDate?: string): Observable<UploadSourcePdfResultDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (reportDate) {
      formData.append('reportDate', reportDate);
    }
    return this.http.post<UploadSourcePdfResultDto>(
      `${this.baseUrl}/api/shariah/sources/${encodeURIComponent(sourceKey)}/report-file`, formData);
  }

  getSourcePdfUrl(sourceKey: string): string {
    return `${this.baseUrl}/api/shariah/source-pdf/${encodeURIComponent(sourceKey)}`;
  }

  /**
   * Absolute backend URL for a board's stored PDF report, or null when the
   * source has none. THE single helper for Sharia document links: stored
   * `pdfUrl` values are backend-relative paths that must never be used as-is
   * on the frontend origin (the SPA catch-all would serve the app instead).
   */
  sourcePdfUrlFor(sourceKey: number | null | undefined): string | null {
    const key = sourceKey === 5 ? 'FaisalBank' : sourceKey === 6 ? 'Ostoul' : null;
    return key ? this.getSourcePdfUrl(key) : null;
  }

  seedShariah(payload?: any): Observable<SeedShariahResultDto> {
    return this.http.post<SeedShariahResultDto>(`${this.baseUrl}/api/shariah/seed`, payload || null);
  }

  refreshShariah(): Observable<RefreshShariahDataResult> {
    return this.http.post<RefreshShariahDataResult>(`${this.baseUrl}/api/shariah/refresh`, {});
  }

  // ── Job Settings (Automation toggles) ──────────────────────────────
  getJobSettings(): Observable<Record<string, boolean>> {
    return this.http.get<Record<string, boolean>>(`${this.baseUrl}/api/job-settings`);
  }

  setJobSetting(jobKey: string, enabled: boolean): Observable<{ jobKey: string; enabled: boolean }> {
    return this.http.put<{ jobKey: string; enabled: boolean }>(
      `${this.baseUrl}/api/job-settings/${encodeURIComponent(jobKey)}`,
      { enabled }
    );
  }

  // ── Stock / Sector / Index Management (admin) ───────────────────────
  searchStocksForManagement(q?: string): Observable<StockManagementItem[]> {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    return this.http.get<StockManagementItem[]>(`${this.baseUrl}/api/admin/stocks-management/search${params}`);
  }

  createManagedStock(req: CreateStockRequest): Observable<StockManagementItem> {
    return this.http.post<StockManagementItem>(`${this.baseUrl}/api/admin/stocks-management`, req);
  }

  assignStockSector(stockId: number, sectorId: number): Observable<StockManagementItem> {
    return this.http.patch<StockManagementItem>(
      `${this.baseUrl}/api/admin/stocks-management/${stockId}/sector`,
      { sectorId } as AssignSectorRequest
    );
  }

  removeStockFromSector(stockId: number): Observable<StockManagementItem> {
    return this.http.delete<StockManagementItem>(
      `${this.baseUrl}/api/admin/stocks-management/${stockId}/sector`
    );
  }

  getManagementSectors(): Observable<SectorPickerItem[]> {
    return this.http.get<SectorPickerItem[]>(`${this.baseUrl}/api/admin/stocks-management/sectors`);
  }

  getManagementIndices(): Observable<IndexPickerItem[]> {
    return this.http.get<IndexPickerItem[]>(`${this.baseUrl}/api/admin/stocks-management/indices`);
  }

  addStockToIndex(stockId: number, indexId: number, req?: AddToIndexRequest): Observable<ConstituentManagementItem> {
    return this.http.post<ConstituentManagementItem>(
      `${this.baseUrl}/api/admin/stocks-management/${stockId}/indices/${indexId}`,
      req || {}
    );
  }

  removeStockFromIndex(stockId: number, indexId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/api/admin/stocks-management/${stockId}/indices/${indexId}`
    );
  }

  // ── Shariah Manual Overrides ───────────────────────────────────────────────

  getShariahOverrides(ticker: string): Observable<ShariahOverridesDto> {
    return this.http.get<ShariahOverridesDto>(`${this.baseUrl}/api/admin/market-data/${encodeURIComponent(ticker)}/shariah-overrides`);
  }

  saveShariahOverrides(ticker: string, request: SaveShariahOverridesRequest): Observable<ShariahOverridesDto> {
    return this.http.patch<ShariahOverridesDto>(`${this.baseUrl}/api/admin/market-data/${encodeURIComponent(ticker)}/shariah-overrides`, request);
  }

  resetShariahOverride(ticker: string, fieldName: string): Observable<ShariahOverridesDto> {
    return this.http.delete<ShariahOverridesDto>(`${this.baseUrl}/api/admin/market-data/${encodeURIComponent(ticker)}/shariah-overrides/${encodeURIComponent(fieldName)}`);
  }
}

