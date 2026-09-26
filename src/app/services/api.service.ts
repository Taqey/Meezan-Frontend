import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  IndexConstituentsPagedResultDto,
  IndexSummaryDto,
  MarketDataDto,
  PagedResult,
  RefreshShariahDataResult,
  RunCombinedScrapeResult,
  ScrapeStatusResponse,
  SectorSummaryDto,
  SeedShariahResultDto,
  StockListItemDto,
  SupportResistanceDto,
  UploadIndexFileResultDto,
  ManualMarketDataUpdateRequest,
  ManualMarketDataUpdateResponse,
  AdminStockLookupItem,
  RemovalCandidateDto,
  RemovalCandidatesActionResult,
  RefreshSelectedStocksResult
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
      priceComparison?: string;
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
      if (params.priceComparison) httpParams = httpParams.set('priceComparison', params.priceComparison);
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
    sectorId?: number;
    shariahStatus?: string;
    priceComparison?: string;
    minCompliantSources?: number;
  }): Observable<PagedResult<StockListItemDto>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
      if (params.pageSize !== undefined) httpParams = httpParams.set('pageSize', params.pageSize);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.indexCode) httpParams = httpParams.set('indexCode', params.indexCode);
      if (params.sectorId !== undefined) httpParams = httpParams.set('sectorId', params.sectorId);
      if (params.shariahStatus) httpParams = httpParams.set('shariahStatus', params.shariahStatus);
      if (params.priceComparison) httpParams = httpParams.set('priceComparison', params.priceComparison);
      if (params.minCompliantSources !== undefined) httpParams = httpParams.set('minCompliantSources', params.minCompliantSources);
    }
    return this.http.get<PagedResult<StockListItemDto>>(`${this.baseUrl}/api/stocks`, {
      params: httpParams
    });
  }

  getMarketData(ticker: string): Observable<MarketDataDto> {
    return this.http.get<MarketDataDto>(`${this.baseUrl}/api/stocks/${ticker}/market-data`);
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
  seedShariah(payload?: any): Observable<SeedShariahResultDto> {
    return this.http.post<SeedShariahResultDto>(`${this.baseUrl}/api/shariah/seed`, payload || null);
  }

  refreshShariah(): Observable<RefreshShariahDataResult> {
    return this.http.post<RefreshShariahDataResult>(`${this.baseUrl}/api/shariah/refresh`, {});
  }
}
