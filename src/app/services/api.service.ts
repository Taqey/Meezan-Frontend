import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  IndexConstituentsPagedResultDto,
  IndexSummaryDto,
  MarketDataDto,
  MarketSnapshotDto,
  RefreshMarketSnapshotsResult,
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
  SaveShariahOverridesRequest,
  // Funds
  FundListItemDto,
  FundDetailDto,
  FundPricePointDto,
  FundAnalysisDto,
  FundSimilarDto,
  FundCategoryDto,
  FundCategoryMembershipDto,
  FundPagedResultDto,
  FundAssetManagerOption,
  FundListFilter,
  FundSortBy,
  FundType,
  FundRiskLevel,
  FundSyncSettings,
  FundSyncSettingsUpdateRequest,
  FundSyncLog,
  FundSyncStatusDto,
  FundPriceSyncResultDto,
  FundSyncLogDetail,
  FundCategory,
  FundCategoryOverride,
  FundCategoryChangeLog,
  FundCategoryChangeLogFilter,
  CategoryChangeAction,
  CategoryFundMember,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  MergeCategoriesRequest,
  FundTypeOptionDto,
  FundTypeDefinition,
  FundTypeChangeLog,
  AdminTypeFundRow,
  CreateFundTypeRequest,
  UpdateFundTypeRequest,
  MergeFundTypesRequest,
  FundClassificationTreeNode,
  AdminClassificationNode,
  ClassificationNodeFundRow,
  ClassificationReview,
  ReclassifyResult,
  ClassificationMigrationReport,
  CreateClassificationNodeRequest,
  UpdateClassificationNodeRequest
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
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

  /** Triggers a market snapshots scrape on demand */
  refreshMarketSnapshots(): Observable<RefreshMarketSnapshotsResult> {
    return this.http.post<RefreshMarketSnapshotsResult>(`${this.baseUrl}/api/market-snapshots/refresh`, {});
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

  recomputeVerdicts(): Observable<{ success: boolean; totalStocks: number; recomputedCount: number; changedCount: number; failedCount: number; message?: string | null }> {
    return this.http.post<{ success: boolean; totalStocks: number; recomputedCount: number; changedCount: number; failedCount: number; message?: string | null }>(`${this.baseUrl}/api/shariah/recompute-verdicts`, {});
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

  // One-time backfill for CoreActivityCompliant
  backfillCoreActivityCompliant(): Observable<{ updatedCount: number; message: string }> {
    return this.http.post<{ updatedCount: number; message: string }>(`${this.baseUrl}/api/admin/market-data/shariah-backfill-core-activity`, {});
  }

  // ── Funds ─────────────────────────────────────────────────────────────────

  getFunds(filter: FundListFilter): Observable<FundPagedResultDto> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    return this.http.get<FundPagedResultDto>(`${this.baseUrl}/api/funds?${params.toString()}`);
  }


  /** Lightweight KPI aggregates - single DB query, no fund records downloaded. */
  getFundStats(): Observable<{ totalCount: number; islamicCount: number; totalAum: number; bestDailyChange: number | null; bestDailyChangeCode: string | null }> {
    return this.http.get<{ totalCount: number; islamicCount: number; totalAum: number; bestDailyChange: number | null; bestDailyChangeCode: string | null }>(`${this.baseUrl}/api/funds/stats`);
  }
  getFund(id: number): Observable<FundDetailDto> {
    return this.http.get<FundDetailDto>(`${this.baseUrl}/api/funds/${id}`);
  }

  getFundBySlug(slug: string): Observable<FundDetailDto> {
    return this.http.get<FundDetailDto>(`${this.baseUrl}/api/funds/slug/${encodeURIComponent(slug)}`);
  }

  getFundCategories(): Observable<FundCategoryDto[]> {
    return this.http.get<FundCategoryDto[]>(`${this.baseUrl}/api/funds/categories`);
  }

  /** Editable type catalog powering the public type dropdown (labels come from the DB). */
  getFundTypes(): Observable<FundTypeOptionDto[]> {
    return this.http.get<FundTypeOptionDto[]>(`${this.baseUrl}/api/funds/types`);
  }

  /** Distinct asset managers with fund counts for public filters. */
  getFundAssetManagers(): Observable<FundAssetManagerOption[]> {
    return this.http.get<FundAssetManagerOption[]>(`${this.baseUrl}/api/funds/managers`);
  }

  // ── Admin Fund Types ───────────────────────────────────────────────────────

  getAllFundTypes(includeDeleted = false): Observable<FundTypeDefinition[]> {
    return this.http.get<FundTypeDefinition[]>(`${this.baseUrl}/api/admin/funds/types?includeDeleted=${includeDeleted}`);
  }

  createFundType(req: CreateFundTypeRequest): Observable<FundTypeDefinition> {
    return this.http.post<FundTypeDefinition>(`${this.baseUrl}/api/admin/funds/types`, req);
  }

  updateFundType(id: number, req: UpdateFundTypeRequest): Observable<FundTypeDefinition> {
    return this.http.patch<FundTypeDefinition>(`${this.baseUrl}/api/admin/funds/types/${id}`, req);
  }

  deleteFundType(id: number, confirm = false): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/admin/funds/types/${id}?confirm=${confirm}`);
  }

  restoreFundType(id: number): Observable<FundTypeDefinition> {
    return this.http.post<FundTypeDefinition>(`${this.baseUrl}/api/admin/funds/types/${id}/restore`, {});
  }

  mergeFundTypes(req: MergeFundTypesRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/funds/types/merge`, req);
  }

  reorderFundTypes(orderedIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/funds/types/reorder`, { orderedIds });
  }

  getFundTypeMembers(
    typeId: number,
    search?: string,
    page = 1,
    pageSize = 50
  ): Observable<{ totalCount: number; totalPages: number; page: number; pageSize: number; items: AdminTypeFundRow[] }> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.http.get<{ totalCount: number; totalPages: number; page: number; pageSize: number; items: AdminTypeFundRow[] }>(
      `${this.baseUrl}/api/admin/funds/types/${typeId}/funds?${params.toString()}`);
  }

  setFundTypeOverride(fundId: number, typeId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/funds/types/funds/${fundId}/${typeId}`, {});
  }

  clearFundTypeOverride(fundId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/admin/funds/types/funds/${fundId}`);
  }

  /** Move a fund to a different type (targetTypeId=null to reset to auto). */
  moveFundType(fundId: number, targetTypeId: number | null): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/funds/types/funds/${fundId}/move`, { targetTypeId });
  }

  /** Bulk-override many funds into one type. */
  bulkAddFundsToType(typeId: number, fundIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/funds/types/${typeId}/funds/bulk`, { fundIds });
  }

  getFundTypeChanges(page = 1, pageSize = 50): Observable<{ items: FundTypeChangeLog[]; totalCount: number }> {
    return this.http.get<{ items: FundTypeChangeLog[]; totalCount: number }>(
      `${this.baseUrl}/api/admin/funds/types/changes?page=${page}&pageSize=${pageSize}`);
  }

  backfillFundLogos(): Observable<{ stored: number; message: string }> {
    return this.http.post<{ stored: number; message: string }>(`${this.baseUrl}/api/admin/funds/logos/backfill`, {});
  }

  /** Public classification tree: visible nodes that contain funds (empty + hidden excluded). */
  getClassificationTree(): Observable<FundClassificationTreeNode[]> {
    return this.http.get<FundClassificationTreeNode[]>(`${this.baseUrl}/api/funds/classification-tree`);
  }

  // ── Admin Classification Tree ─────────────────────────────────────────────

  seedMigrateClassification(): Observable<ClassificationMigrationReport> {
    return this.http.post<ClassificationMigrationReport>(`${this.baseUrl}/api/admin/funds/classification/seed-migrate`, {});
  }

  getClassificationAdminTree(includeDeleted = false): Observable<AdminClassificationNode[]> {
    return this.http.get<AdminClassificationNode[]>(`${this.baseUrl}/api/admin/funds/classification/tree?includeDeleted=${includeDeleted}`);
  }

  createClassificationNode(req: CreateClassificationNodeRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/funds/classification/nodes`, req);
  }

  updateClassificationNode(id: number, req: UpdateClassificationNodeRequest): Observable<AdminClassificationNode> {
    return this.http.patch<AdminClassificationNode>(`${this.baseUrl}/api/admin/funds/classification/nodes/${id}`, req);
  }

  moveClassificationNode(id: number, newParentId: number | null): Observable<AdminClassificationNode> {
    return this.http.post<AdminClassificationNode>(`${this.baseUrl}/api/admin/funds/classification/nodes/${id}/move`, { newParentId });
  }

  mergeClassificationNodes(sourceId: number, targetId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/funds/classification/nodes/merge`, { sourceId, targetId });
  }

  deleteClassificationNodePreview(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/admin/funds/classification/nodes/${id}/delete-preview`);
  }

  deleteClassificationNode(id: number, confirm = false, moveFundsToNodeId?: number | null, resetFundsToAuto = false, moveChildrenToNodeId?: number | null): Observable<any> {
    const params = new URLSearchParams();
    params.set('confirm', String(confirm));
    if (moveFundsToNodeId != null) params.set('moveFundsToNodeId', String(moveFundsToNodeId));
    if (resetFundsToAuto) params.set('resetFundsToAuto', 'true');
    if (moveChildrenToNodeId != null) params.set('moveChildrenToNodeId', String(moveChildrenToNodeId));
    return this.http.delete(`${this.baseUrl}/api/admin/funds/classification/nodes/${id}?${params.toString()}`);
  }

  restoreClassificationNode(id: number): Observable<AdminClassificationNode> {
    return this.http.post<AdminClassificationNode>(`${this.baseUrl}/api/admin/funds/classification/nodes/${id}/restore`, {});
  }

  getClassificationNodeFunds(nodeId: number, search = '', source = '', page = 1, pageSize = 25): Observable<{ node: any; path: any[]; items: ClassificationNodeFundRow[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (source) params.set('source', source);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.http.get<{ node: any; path: any[]; items: ClassificationNodeFundRow[]; totalCount: number; page: number; pageSize: number; totalPages: number }>(`${this.baseUrl}/api/admin/funds/classification/nodes/${nodeId}/funds?${params.toString()}`);
  }

  bulkAddFundsToNode(nodeId: number, fundIds: number[]): Observable<{ added: number; failed: number; errors: string[] }> {
    return this.http.post<{ added: number; failed: number; errors: string[] }>(`${this.baseUrl}/api/admin/funds/classification/nodes/${nodeId}/funds/bulk`, { fundIds });
  }

  bulkRemoveFundsFromNode(nodeId: number, fundIds: number[], destinationNodeId?: number | null, resetToAuto = false): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/admin/funds/classification/nodes/${nodeId}/funds/bulk`, { body: { fundIds, destinationNodeId, resetToAuto } });
  }

  assignFundToNode(fundId: number, nodeId: number, reason?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/funds/classification/funds/${fundId}/assign`, { nodeId, reason });
  }

  resetFundClassification(fundId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/admin/funds/classification/funds/${fundId}/assign`);
  }

  getClassificationReview(): Observable<ClassificationReview> {
    return this.http.get<ClassificationReview>(`${this.baseUrl}/api/admin/funds/classification/review`);
  }

  reclassifyUnclassified(): Observable<ReclassifyResult> {
    return this.http.post<ReclassifyResult>(`${this.baseUrl}/api/admin/funds/classification/reclassify-unclassified`, {});
  }

  getClassificationChanges(page = 1, pageSize = 50, fundId?: number | null, nodeId?: number | null): Observable<{ items: any[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (fundId != null) params.set('fundId', String(fundId));
    if (nodeId != null) params.set('nodeId', String(nodeId));
    return this.http.get<{ items: any[]; totalCount: number; page: number; pageSize: number; totalPages: number }>(`${this.baseUrl}/api/admin/funds/classification/changes?${params.toString()}`);
  }

  getClassificationBackup(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/admin/funds/classification/backup`);
  }

  // ── Admin Funds ───────────────────────────────────────────────────────────

  // Sync settings
  getFundSyncSettings(): Observable<FundSyncSettings> {
    return this.http.get<FundSyncSettings>(`${this.baseUrl}/api/admin/funds/sync/settings`);
  }

  updateFundSyncSettings(request: FundSyncSettingsUpdateRequest): Observable<FundSyncSettings> {
    return this.http.patch<FundSyncSettings>(`${this.baseUrl}/api/admin/funds/sync/settings`, request);
  }

  // Sync runs
  getFundSyncStatus(): Observable<FundSyncStatusDto> {
    return this.http.get<FundSyncStatusDto>(`${this.baseUrl}/api/admin/funds/sync/status`);
  }

  getLatestFundSyncRun(): Observable<FundSyncLog> {
    return this.http.get<FundSyncLog>(`${this.baseUrl}/api/admin/funds/sync/latest`);
  }

  getFundSyncHistory(page = 1, pageSize = 20): Observable<{ items: FundSyncLog[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    return this.http.get<{ items: FundSyncLog[]; totalCount: number; page: number; pageSize: number; totalPages: number }>(`${this.baseUrl}/api/admin/funds/sync/history?page=${page}&pageSize=${pageSize}`);
  }

  runFundSyncNow(): Observable<FundSyncLog> {
    return this.http.post<FundSyncLog>(`${this.baseUrl}/api/admin/funds/sync/run`, {});
  }

  runFundPriceSyncNow(): Observable<FundPriceSyncResultDto> {
    return this.http.post<FundPriceSyncResultDto>(`${this.baseUrl}/api/admin/funds/sync/prices`, {});
  }

  getFundSyncRunDetails(runId: number): Observable<FundSyncLogDetail[]> {
    return this.http.get<FundSyncLogDetail[]>(`${this.baseUrl}/api/admin/funds/sync/${runId}/details`);
  }

  getCategoryFunds(categoryId: number, search = '', source = '', page = 1, pageSize = 50): Observable<{ items: CategoryFundMember[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (source) params.set('source', source);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.http.get<{ items: CategoryFundMember[]; totalCount: number; page: number; pageSize: number; totalPages: number }>(`${this.baseUrl}/api/admin/funds/categories/${categoryId}/funds?${params.toString()}`);
  }

  resetFundOverrides(fundId: number): Observable<{ message: string; clearedCount: number }> {
    return this.http.delete<{ message: string; clearedCount: number }>(`${this.baseUrl}/api/admin/funds/funds/${fundId}/overrides`);
  }

  resetCategoryOverrides(categoryId: number): Observable<{ message: string; clearedCount: number }> {
    return this.http.delete<{ message: string; clearedCount: number }>(`${this.baseUrl}/api/admin/funds/categories/${categoryId}/overrides`);
  }

  // Categories
  getAllFundCategories(includeDeleted = false): Observable<FundCategory[]> {
    return this.http.get<FundCategory[]>(`${this.baseUrl}/api/admin/funds/categories?includeDeleted=${includeDeleted}`);
  }

  getFundCategory(id: number): Observable<FundCategory> {
    return this.http.get<FundCategory>(`${this.baseUrl}/api/admin/funds/categories/${id}`);
  }

  createFundCategory(request: CreateCategoryRequest): Observable<FundCategory> {
    return this.http.post<FundCategory>(`${this.baseUrl}/api/admin/funds/categories`, request);
  }

  updateFundCategory(id: number, request: UpdateCategoryRequest): Observable<FundCategory> {
    return this.http.patch<FundCategory>(`${this.baseUrl}/api/admin/funds/categories/${id}`, request);
  }

  deleteFundCategory(id: number, confirm = false): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/admin/funds/categories/${id}?confirm=${confirm}`);
  }

  restoreFundCategory(id: number): Observable<FundCategory> {
    return this.http.post<FundCategory>(`${this.baseUrl}/api/admin/funds/categories/${id}/restore`, {});
  }

  mergeFundCategories(request: MergeCategoriesRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/funds/categories/merge`, request);
  }

  // Category overrides
  getFundCategoryOverrides(fundId: number): Observable<FundCategoryOverride[]> {
    return this.http.get<FundCategoryOverride[]>(`${this.baseUrl}/api/admin/funds/funds/${fundId}/category-overrides`);
  }

  getFundCategoriesWithOverrides(fundId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/admin/funds/funds/${fundId}/categories`);
  }

  includeFundInCategory(fundId: number, categoryId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/funds/funds/${fundId}/categories/${categoryId}/include`, {});
  }

  excludeFundFromCategory(fundId: number, categoryId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/funds/funds/${fundId}/categories/${categoryId}/exclude`, {});
  }

  resetFundCategoryOverride(fundId: number, categoryId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/admin/funds/funds/${fundId}/categories/${categoryId}/override`);
  }

  // Category change log
  getFundCategoryChanges(filter: FundCategoryChangeLogFilter): Observable<{ items: FundCategoryChangeLog[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    return this.http.get<{ items: FundCategoryChangeLog[]; totalCount: number; page: number; pageSize: number; totalPages: number }>(`${this.baseUrl}/api/admin/funds/category-changes?${params.toString()}`);
  }

  // Admin fund management
  getAllFundsAdmin(search?: string, type?: string, page = 1, pageSize = 50): Observable<{ items: FundListItemDto[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (type) params.set('type', type);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.http.get<{ items: FundListItemDto[]; totalCount: number; page: number; pageSize: number; totalPages: number }>(`${this.baseUrl}/api/admin/funds/funds?${params.toString()}`);
  }

  getFundAdmin(id: number): Observable<FundListItemDto> {
    return this.http.get<FundListItemDto>(`${this.baseUrl}/api/admin/funds/funds/${id}`);
  }

  // Cache management
  getFundCacheStatus(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/admin/funds/cache/status`);
  }

  clearFundCache(): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/api/admin/funds/cache/clear`, {});
  }

  rebuildFundCache(): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/api/admin/funds/cache/rebuild`, {});
  }
}

