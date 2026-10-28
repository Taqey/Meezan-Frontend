import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Layers, ShieldCheck, TrendingUp, Flame } from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { SessionCacheService } from '../../services/session-cache.service';
import { navigateQueryParams } from '../../utils/navigation-utils';
import { IndexSummaryDto, PagedResult, SectorSummaryDto, StockListItemDto } from '../../models/api.models';
import { matchesNonComplianceType, normalizeStatusValue } from '../../models/shariah-standards';
import { MzListingPageComponent, type MzListingConfig } from '../../components/ui/ui-listing-page';
import { stockToCard } from '../../components/ui/ui-mappers';
import { MzSelectComponent, type MzStat, type MzOption } from '../../components/ui/ui-small';

import { ViewSwitcherComponent, type EntityView } from '../../components/view-switcher/view-switcher.component';
import { TreemapComponent, type TreemapItem } from '../../components/treemap/treemap.component';

@Component({
  selector: 'app-sector-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MzListingPageComponent, MzSelectComponent, ViewSwitcherComponent, TreemapComponent],
  template: `
    <mz-listing-page
      [config]="config"
      [customView]="view !== 'grid'"
      (tabChange)="onTabChange($event)"
      (searchChange)="onSearchInput($event)"
      (controlChange)="onControlChange($event)"
      (sortChange)="onSortSelect($event)"
      (advancedClick)="advancedOpen = !advancedOpen; rebuild()"
      (pageChange)="setPage($event)"
      (retry)="retry()">

      <ng-container actions>
        <app-view-switcher [view]="view" (viewChange)="setView($event)"></app-view-switcher>
      </ng-container>

      <ng-container view>
        <app-treemap
          *ngIf="view === 'heatmap' && !kpisLoading"
          [items]="treemapItems"
          [unweightedCount]="unweightedCount"
          unweightedLabel="سهم بدون وزن نسبي غير معروضة في الخريطة"
          sizeNote="حجم كل مربع يمثل الوزن النسبي للسهم في القطاع">
        </app-treemap>
      </ng-container>

      <div resultsExtra class="mz-active-filters">
        <span class="mz-badge pill neutral" *ngFor="let code of indexCodes">المؤشر: {{ code }} <button type="button" class="mz-x" (click)="removeIndex(code)" aria-label="إزالة">×</button></span>
        <span class="mz-badge pill neutral" *ngFor="let st of shariahStatuses">الحكم: {{ getShariahLabel(st) }} <button type="button" class="mz-x" (click)="removeShariah(st)" aria-label="إزالة">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="nonComplianceType">سبب عدم التوافق: {{ nonComplianceType === 'activity' ? 'النشاط' : 'النسب المالية' }} <button type="button" class="mz-x" (click)="clearFilter('nonComplianceType')" aria-label="إزالة">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="priceComparison">التقييم: {{ getPriceComparisonLabel(priceComparison) }} <button type="button" class="mz-x" (click)="clearFilter('priceComparison')" aria-label="إزالة">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="minCompliantSources">الجهات: ≥ {{ minCompliantSources }} <button type="button" class="mz-x" (click)="clearFilter('minCompliantSources')" aria-label="إزالة">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="minPe !== null || maxPe !== null">مكرر الربحية: {{ minPe ?? 0 }} - {{ maxPe ?? '∞' }} <button type="button" class="mz-x" (click)="clearPeFilter()" aria-label="إزالة">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="minPb !== null || maxPb !== null">مضاعف الدفترية: {{ minPb ?? 0 }} - {{ maxPb ?? '∞' }} <button type="button" class="mz-x" (click)="clearPbFilter()" aria-label="إزالة">×</button></span>
      </div>

      <div advanced class="mz-adv-grid">
        <!-- Right Column: Stacked authorities/compliance dropdown + results per page -->
        <div class="mz-adv-col">
          <div class="mz-adv-item" *ngIf="shariahStatuses.includes('NonCompliant')">
            <span class="mz-slicer-head"><span>سبب عدم التوافق</span></span>
            <mz-select size="compact"
              [options]="nonComplianceOptions"
              [(ngModel)]="nonComplianceType"
              (valueChange)="nonComplianceType = $event; onFilterChange()"
              ariaLabel="سبب عدم التوافق">
            </mz-select>
          </div>
          <div class="mz-adv-item">
            <span class="mz-slicer-head"><span>الحد الأدنى للمصادر المتوافقة</span></span>
            <mz-select size="compact"
              [options]="minCompliantOptions"
              [(ngModel)]="minCompliantSources"
              (valueChange)="minCompliantSources = $event; onFilterChange()"
              ariaLabel="الحد الأدنى للمصادر المتوافقة">
            </mz-select>
          </div>
          <div class="mz-adv-item">
            <span class="mz-slicer-head"><span>النتائج لكل صفحة</span></span>
            <mz-select size="compact"
              [options]="pageSizeOptions"
              [(ngModel)]="pageSize"
              (valueChange)="pageSize = $event; onPageSizeChange()"
              ariaLabel="عدد الأسهم في الصفحة">
            </mz-select>
          </div>
        </div>

        <!-- Middle Column: P/E range card -->
        <div class="mz-slicer">
          <div class="mz-slicer-head"><span>مكرر الربحية (P/E)</span><span>{{ minPe !== null ? minPe : 0 }} - {{ maxPe !== null ? maxPe : 100 }}</span></div>
          <div class="mz-slicer-inputs">
            <input class="mz-select" type="number" placeholder="من" [ngModel]="minPe" (ngModelChange)="onPeMinChange($event)" min="0" max="100" aria-label="الحد الأدنى لمكرر الربحية" />
            <span>—</span>
            <input class="mz-select" type="number" placeholder="إلى" [ngModel]="maxPe" (ngModelChange)="onPeMaxChange($event)" min="0" max="100" aria-label="الحد الأقصى لمكرر الربحية" />
          </div>
          <input type="range" min="0" max="100" [ngModel]="maxPe !== null ? maxPe : 100" (ngModelChange)="onPeMaxChange($event)" aria-label="شريط أقصى مكرر ربحية" />
        </div>

        <!-- Left Column: P/B range card -->
        <div class="mz-slicer">
          <div class="mz-slicer-head"><span>مضاعف القيمة الدفترية (P/B)</span><span>{{ minPb !== null ? minPb : 0 }} - {{ maxPb !== null ? maxPb : 20 }}</span></div>
          <div class="mz-slicer-inputs">
            <input class="mz-select" type="number" step="0.5" placeholder="من" [ngModel]="minPb" (ngModelChange)="onPbMinChange($event)" min="0" max="20" aria-label="الحد الأدنى لمضاعف القيمة الدفترية" />
            <span>—</span>
            <input class="mz-select" type="number" step="0.5" placeholder="إلى" [ngModel]="maxPb" (ngModelChange)="onPbMaxChange($event)" min="0" max="20" aria-label="الحد الأقصى لمضاعف القيمة الدفترية" />
          </div>
          <input type="range" min="0" max="20" step="0.5" [ngModel]="maxPb !== null ? maxPb : 20" (ngModelChange)="onPbMaxChange($event)" aria-label="شريط أقصى مضاعف قيمة دفترية" />
        </div>
      </div>
    </mz-listing-page>
  `
})
export class SectorDetailComponent implements OnInit, OnDestroy {
  readonly LayersIcon = Layers;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly TrendingUpIcon = TrendingUp;
  readonly FlameIcon = Flame;

  readonly shariahOptions = [
    { value: 'Compliant', label: 'متوافق شرعاً' },
    { value: 'NonCompliant', label: 'غير متوافق' },
    { value: 'Pending', label: 'البيانات غير كافية' },
    { value: 'Blocked', label: 'محظور' }
  ];

  readonly nonComplianceOptions: MzOption[] = [
    { value: '', label: 'الكل (نشاط + نسب)' },
    { value: 'activity', label: 'النشاط الأساسي' },
    { value: 'ratios', label: 'النسب المالية' }
  ];

  readonly minCompliantOptions: MzOption[] = [
    { value: '', label: 'الجهات المتوافقة: الكل' },
    { value: '3', label: '3 جهات فأكثر' },
    { value: '5', label: '5 جهات فأكثر' },
    { value: '7', label: 'إجماع كامل (7 من 7)' }
  ];

  readonly pageSizeOptions: MzOption[] = [
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 18, label: '18' },
    { value: 20, label: '20' },
    { value: 50, label: '50' },
    { value: 100, label: '100' }
  ];

  readonly sortFields = [
    { value: 'weight', label: 'الوزن النسبي' },
    { value: 'changePct', label: 'نسبة التغير' },
    { value: 'closingPrice', label: 'سعر الإغلاق' },
    { value: 'fairValueDiffPct', label: 'فارق القيمة العادلة' },
    { value: 'ticker', label: 'رمز السهم' }
  ];

  sectorId: number | null = null;
  sector?: SectorSummaryDto | null;
  stocks: StockListItemDto[] = [];
  allSectorStocks: StockListItemDto[] = [];
  kpisLoading = true;
  indices: IndexSummaryDto[] = [];
  totalCount = 0;
  totalPages = 1;
  loading = true;
  stocksLoading = false;
  loadError = false;
  advancedOpen = false;

  view: EntityView = 'grid';
  page = 1;
  pageSize = 18;
  search = '';
  indexCodes: string[] = [];
  shariahStatuses: string[] = [];
  priceComparison = '';
  minCompliantSources = '';
  sortBy = 'changePct';
  sortDir = 'desc';

  minPe: number | null = null;
  maxPe: number | null = null;
  minPb: number | null = null;
  maxPb: number | null = null;
  nonComplianceType = '';
  sectorWeightWarning: string | null = null;

  config: MzListingConfig = {
    header: { badge: 'قطاع اقتصادي', title: 'القطاع', description: '' },
    cards: [],
    empty: { title: '', message: '' }
  };

  private searchDebounceTimer?: any;
  private slicerDebounceTimer?: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cache: SessionCacheService
  ) {}

  ngOnInit(): void {
    this.api.getIndices().subscribe({
      next: (data) => {
        this.indices = data || [];
        this.rebuild();
      }
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.sectorId = id ? Number(id) : null;
      if (this.sectorId) {
        this.loadSectorInfo();
        this.loadSectorKpis();
      } else {
        this.loading = false;
        this.kpisLoading = false;
        this.rebuild();
      }
    });

    this.route.queryParams.subscribe((params) => {
      if (this.sectorId) {
        const saved = this.cache.getUiState<any>('sector-detail-' + this.sectorId);
        if (saved && !Object.keys(params).length) {
          this.page = saved.page || 1;
          this.pageSize = saved.pageSize || 18;
          this.search = saved.search || '';
          this.indexCodes = saved.indexCodes || [];
          this.shariahStatuses = saved.shariahStatuses || [];
          this.priceComparison = saved.priceComparison || '';
          this.minCompliantSources = saved.minCompliantSources || '';
          this.minPe = saved.minPe ?? null;
          this.maxPe = saved.maxPe ?? null;
          this.minPb = saved.minPb ?? null;
          this.maxPb = saved.maxPb ?? null;
          this.nonComplianceType = saved.nonComplianceType || '';
          this.sortBy = saved.sortBy || 'changePct';
          this.sortDir = saved.sortDir || 'desc';
          this.advancedOpen = saved.advancedOpen || false;
          this.view = saved.view || 'grid';
          this.loadStocks();
          return;
        }
      }

      this.page = params['page'] ? Number(params['page']) : 1;
      this.pageSize = params['pageSize'] ? Number(params['pageSize']) : 18;
      this.search = params['search'] || '';

      if (params['indexCodes']) {
        const val = params['indexCodes'];
        this.indexCodes = Array.isArray(val) ? val : String(val).split(',').map(s => s.trim()).filter(Boolean);
      } else if (params['indexCode']) {
        this.indexCodes = [String(params['indexCode']).trim()];
      } else {
        this.indexCodes = [];
      }

      if (params['shariahStatuses']) {
        const val = params['shariahStatuses'];
        this.shariahStatuses = Array.isArray(val) ? val : String(val).split(',').map(s => s.trim()).filter(Boolean);
      } else if (params['shariahStatus']) {
        this.shariahStatuses = [String(params['shariahStatus']).trim()];
      } else {
        this.shariahStatuses = [];
      }

      this.priceComparison = params['priceComparison'] || '';
      this.minCompliantSources = params['minCompliantSources'] || '';
      this.sortBy = params['sortBy'] || 'changePct';
      this.sortDir = params['sortDir'] || 'desc';

      this.minPe = params['minPe'] !== undefined && params['minPe'] !== null ? Number(params['minPe']) : null;
      this.maxPe = params['maxPe'] !== undefined && params['maxPe'] !== null ? Number(params['maxPe']) : null;
      this.minPb = params['minPb'] !== undefined && params['minPb'] !== null ? Number(params['minPb']) : null;
      this.maxPb = params['maxPb'] !== undefined && params['maxPb'] !== null ? Number(params['maxPb']) : null;
      this.nonComplianceType = params['nonComplianceType'] || '';
      if (params['view'] === 'heatmap' || params['view'] === 'grid') {
        this.view = params['view'];
      }

      if (this.sectorId) {
        this.loadStocks();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sectorId) {
      this.cache.saveScroll('sector-detail-' + this.sectorId, window.scrollX, window.scrollY);
      this.cache.saveUiState('sector-detail-' + this.sectorId, {
        page: this.page,
        pageSize: this.pageSize,
        search: this.search,
        indexCodes: this.indexCodes,
        shariahStatuses: this.shariahStatuses,
        priceComparison: this.priceComparison,
        minCompliantSources: this.minCompliantSources,
        minPe: this.minPe,
        maxPe: this.maxPe,
        minPb: this.minPb,
        maxPb: this.maxPb,
        nonComplianceType: this.nonComplianceType,
        sortBy: this.sortBy,
        sortDir: this.sortDir,
        advancedOpen: this.advancedOpen,
        view: this.view
      });
    }
  }

  private loadSectorInfo(): void {
    const metaCacheKey = 'sector_meta_' + this.sectorId;
    const cached = this.cache.get<SectorSummaryDto>(metaCacheKey);
    if (cached) {
      this.sector = cached.data;
      this.loading = false;
      this.rebuild();
      if (!this.cache.isStale(metaCacheKey)) {
        return;
      }
    }

    this.api.getSectors().subscribe({
      next: (sectors) => {
        this.sector = sectors.find((s) => s.id === this.sectorId) ?? null;
        if (this.sector) {
          this.cache.set(metaCacheKey, this.sector);
        }
        this.loading = false;
        this.rebuild();
      },
      error: () => {
        this.sector = null;
        this.loading = false;
        this.rebuild();
      }
    });
  }

  private loadSectorKpis(): void {
    if (!this.sectorId) {
      this.kpisLoading = false;
      this.rebuild();
      return;
    }
    const kpiCacheKey = 'sector_kpis_' + this.sectorId;
    const cached = this.cache.get<StockListItemDto[]>(kpiCacheKey);
    if (cached) {
      this.allSectorStocks = cached.data || [];
      this.kpisLoading = false;
      this.rebuild();
      if (!this.cache.isStale(kpiCacheKey)) {
        return;
      }
    }

    this.api.getStocks({ sectorId: this.sectorId, page: 1, pageSize: 200 }).subscribe({
      next: (res) => {
        this.allSectorStocks = res.items || [];
        this.cache.set(kpiCacheKey, this.allSectorStocks);
        this.kpisLoading = false;
        this.rebuild();
      },
      error: () => {
        this.kpisLoading = false;
        this.rebuild();
      }
    });
  }

  retry(): void {
    this.loadSectorInfo();
    this.loadSectorKpis();
    this.loadStocks();
  }

  get isNonComplianceFiltered(): boolean {
    return !!(this.nonComplianceType && this.shariahStatuses.includes('NonCompliant'));
  }

  loadStocks(): void {
    const queryParams = {
      sectorId: this.sectorId ?? undefined,
      page: this.isNonComplianceFiltered ? 1 : this.page,
      pageSize: this.isNonComplianceFiltered ? 200 : this.pageSize,
      search: this.search || undefined,
      indexCodes: this.indexCodes.length ? this.indexCodes : undefined,
      shariahStatuses: this.shariahStatuses.length ? this.shariahStatuses : undefined,
      priceComparison: this.priceComparison || undefined,
      minCompliantSources: this.minCompliantSources ? Number(this.minCompliantSources) : undefined,
      minPeRatio: this.minPe !== null ? this.minPe : undefined,
      maxPeRatio: this.maxPe !== null ? this.maxPe : undefined,
      minPbRatio: this.minPb !== null ? this.minPb : undefined,
      maxPbRatio: this.maxPb !== null ? this.maxPb : undefined,
      sortBy: this.sortBy,
      sortDir: this.sortDir
    };

    const cacheKey = 'sector_stocks_' + JSON.stringify(queryParams);
    const cached = this.cache.get<PagedResult<StockListItemDto>>(cacheKey);
    if (cached) {
      this.applyStocksResult(cached.data);
      this.loadError = false;
      if (this.sectorId) {
        this.cache.restoreScroll('sector-detail-' + this.sectorId);
      }
      if (!this.cache.isStale(cacheKey)) {
        return;
      }
    } else {
      this.stocksLoading = true;
      this.loadError = false;
      this.rebuild();
    }

    this.api.getStocks(queryParams).subscribe({
      next: (res: PagedResult<StockListItemDto>) => {
        this.cache.set(cacheKey, res);
        this.loadError = false;
        this.applyStocksResult(res);
      },
      error: () => {
        this.stocksLoading = false;
        if (!cached) {
          this.stocks = [];
          this.totalCount = 0;
          this.totalPages = 1;
          this.loadError = true;
        }
        this.rebuild();
      }
    });
  }

  private applyStocksResult(res: PagedResult<StockListItemDto>): void {
    this.stocks = res.items || [];
    if (this.isNonComplianceFiltered) {
      const filtered = this.stocks.filter((s) => matchesNonComplianceType(s, this.nonComplianceType));
      this.totalCount = filtered.length;
      this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
      if (this.page > this.totalPages) this.page = 1;
    } else {
      this.totalCount = res.totalCount || 0;
      this.totalPages = res.totalPages || Math.ceil(this.totalCount / this.pageSize) || 1;
    }
    this.stocksLoading = false;

    if (!this.search && !this.indexCodes.length && !this.shariahStatuses.length && !this.priceComparison && !this.minCompliantSources && !this.nonComplianceType) {
      const sum = this.stocks.reduce((acc, s) => acc + (s.weight || 0), 0);
      if (this.totalCount <= this.pageSize && this.stocks.length > 0) {
        if (Math.abs(sum - 100) > 0.5) {
          this.sectorWeightWarning = `تنبيه: مجموع أوزان أسهم القطاع (${sum.toFixed(2)}%) لا يساوي 100%.`;
        } else {
          this.sectorWeightWarning = null;
        }
      } else {
        this.sectorWeightWarning = null;
      }
    } else {
      this.sectorWeightWarning = null;
    }
    this.rebuild();
  }

  get stats(): MzStat[] {
    const totalCountVal = this.sector?.stocksCount ?? (this.allSectorStocks.length || this.totalCount);
    const compliantCount = this.sector?.compliantStocksCount ?? (this.allSectorStocks.length ? this.allSectorStocks.filter(s => normalizeStatusValue(s.shariahStatus) === 'compliant').length : null);
    const compliantPct = this.sector?.complianceRatePct ?? (totalCountVal && compliantCount != null ? Math.round((compliantCount / totalCountVal) * 100) : null);
    const cheapCount = this.allSectorStocks.length
      ? this.allSectorStocks.filter(s => s.priceComparison === 'Cheap').length
      : null;
    const validPerformers = this.allSectorStocks.filter(s => s.changePct !== null && s.changePct !== undefined);
    const top = validPerformers.length
      ? validPerformers.reduce((best, cur) => ((cur.changePct || 0) > (best.changePct || 0) ? cur : best))
      : null;

    return [
      {
        label: 'إجمالي الأسهم في القطاع',
        value: totalCountVal ? String(totalCountVal) : '—',
        icon: this.LayersIcon,
        chip: 'سهم'
      },
      {
        label: 'الشركات المتوافقة مع الشريعة',
        value: compliantCount != null ? String(compliantCount) : '—',
        icon: this.ShieldCheckIcon,
        chip: compliantPct != null ? `${compliantPct}%` : '—'
      },
      {
        label: 'فرص تقييم رخيص',
        value: cheapCount != null ? String(cheapCount) : '—',
        icon: this.TrendingUpIcon,
        chip: 'أرخص'
      },
      {
        label: 'أعلى أداء اليوم',
        value: top && top.changePct != null ? `${top.changePct > 0 ? '+' : ''}${top.changePct.toFixed(2)}%` : '—',
        icon: this.FlameIcon,
        chip: top ? (top.ticker || top.nameAr || '—') : '—'
      }
    ];
  }

  get activeTab(): string {
    if (this.shariahStatuses.length === 1 && this.shariahStatuses[0] === 'Compliant' && !this.priceComparison) {
      return 'compliant';
    }
    if (this.priceComparison === 'Cheap' && !this.shariahStatuses.length) {
      return 'cheap';
    }
    if (!this.shariahStatuses.length && !this.priceComparison) {
      return 'all';
    }
    return '';
  }

  onTabChange(id: string): void {
    if (id === 'all') {
      this.shariahStatuses = [];
      this.priceComparison = '';
    } else if (id === 'compliant') {
      this.shariahStatuses = ['Compliant'];
      this.priceComparison = '';
    } else if (id === 'cheap') {
      this.shariahStatuses = [];
      this.priceComparison = 'Cheap';
    }
    this.onFilterChange();
  }

  onSearchInput(val: string): void {
    this.search = val;
    this.onSearchChange();
  }

  onControlChange(e: { id: string; values: string[] }): void {
    if (e.id === 'index') {
      this.indexCodes = e.values;
      this.page = 1;
      this.updateUrl();
    } else if (e.id === 'shariah') {
      this.shariahStatuses = e.values;
      this.page = 1;
      this.updateUrl();
    } else if (e.id === 'valuation') {
      this.priceComparison = e.values[0] || '';
      this.onFilterChange();
    }
  }

  onSortSelect(val: string): void {
    const [field, dir] = val.split(':');
    this.sortBy = field;
    this.sortDir = dir;
    this.onFilterChange();
  }

  rebuild(): void {
    const activeFilterCount = (this.nonComplianceType ? 1 : 0) +
      (this.minCompliantSources ? 1 : 0) +
      (this.minPe !== null || this.maxPe !== null ? 1 : 0) +
      (this.minPb !== null || this.maxPb !== null ? 1 : 0) +
      (this.pageSize !== 18 ? 1 : 0);

    const totalCountVal = this.sector?.stocksCount ?? this.totalCount;

    this.config = {
      backLink: { label: 'العودة إلى القطاعات', to: '/indices/Sectoral-Indices' },
      header: {
        badge: 'قطاع اقتصادي',
        count: totalCountVal ? `${totalCountVal} سهم` : '',
        title: this.sector?.nameAr || 'القطاع',
        description: this.sector?.nameEn || ''
      },
      stats: this.stats,
      statsLoading: this.kpisLoading,
      statsCount: 4,
      tabs: [
        { id: 'all', label: 'كل الأسهم' },
        { id: 'compliant', label: 'متوافق شرعاً' },
        { id: 'cheap', label: 'فرص صعود للقيمة العادلة' }
      ],
      activeTab: this.activeTab,
      filters: {
        searchValue: this.search,
        searchPlaceholder: 'ابحث في أسهم القطاع باسم السهم أو رمزه...',
        controls: [
          {
            id: 'index', kind: 'multi', label: 'المؤشرات', allLabel: 'كل المؤشرات',
            options: this.indices.map((i) => ({ value: i.code, label: `${i.code} - ${i.nameAr}` })),
            selected: this.indexCodes
          },
          {
            id: 'shariah', kind: 'multi', label: 'الأحكام', allLabel: 'كل الأحكام الشرعية',
            options: this.shariahOptions, selected: this.shariahStatuses
          },
          {
            id: 'valuation', kind: 'select', label: 'مقارنة القيمة العادلة',
            options: [
              { value: '', label: 'القيمة العادلة: الكل' },
              { value: 'Cheap', label: 'أرخص من العادلة (فرصة)' },
              { value: 'Fair', label: 'قريبة من العادلة (±5%)' },
              { value: 'Expensive', label: 'أغلى من العادلة' },
              { value: 'Unavailable', label: 'لا يمكن حساب القيمة العادلة' }
            ],
            value: this.priceComparison
          }
        ],
        sort: {
          label: 'ترتيب النتائج',
          value: `${this.sortBy}:${this.sortDir}`,
          options: this.sortFields.flatMap((f) => [
            { value: `${f.value}:desc`, label: `الترتيب: ${f.label} (تنازلي)` },
            { value: `${f.value}:asc`, label: `الترتيب: ${f.label} (تصاعدي)` }
          ])
        },
        advanced: { label: 'تصفية متقدمة', open: this.advancedOpen, count: activeFilterCount }
      },
      results: {
        text: this.view === 'heatmap'
          ? `${this.treemapItems.length} سهم معروض في الخريطة الحرارية لقطاع ${this.sector?.nameAr || ''}`
          : `${this.totalCount} سهم في قطاع ${this.sector?.nameAr || ''} (الصفحة ${this.page} من ${this.totalPages || 1})`,
        note: this.sectorWeightWarning,
        legend: [{ label: 'متوافق', tone: 'good' }, { label: 'غير متوافق', tone: 'bad' }]
      },
      cards: this.displayedStocks.map((s) => stockToCard(s, { parent: 'sector' })),
      skeletonCount: this.pageSize,
      cardType: 'stock',
      loading: this.stocksLoading && !this.loadError,
      error: !this.stocksLoading && this.loadError
        ? { title: 'تعذّر تحميل أسهم القطاع', message: 'تحقق من الاتصال بالشبكة ثم حاول مرة أخرى.' }
        : (!this.loading && !this.sector ? { title: 'القطاع غير موجود', message: 'لم يتم العثور على بيانات هذا القطاع.' } : null),
      empty: {
        title: 'لا توجد نتائج مطابقة للفلاتر المختارة',
        message: 'جرّب تعديل خيارات البحث أو إزالة أحد الفلاتر لتوسيع نطاق النتائج.'
      },
      page: this.page,
      totalPages: this.totalPages
    };
  }

  get displayedStocks(): StockListItemDto[] {
    if (!this.isNonComplianceFiltered) return this.stocks;
    const filtered = this.stocks.filter((s) => matchesNonComplianceType(s, this.nonComplianceType));
    const start = (this.page - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  getShariahLabel(status: string): string {
    const match = this.shariahOptions.find(o => o.value === status);
    return match ? match.label : status;
  }

  getPriceComparisonLabel(val: string): string {
    switch (val) {
      case 'Cheap': return 'أرخص من العادلة';
      case 'Fair': return 'قريبة من العادلة';
      case 'Expensive': return 'أغلى من العادلة';
      case 'Unavailable': return 'غير متوفرة';
      default: return val;
    }
  }

  removeIndex(code: string): void {
    this.indexCodes = this.indexCodes.filter(c => c !== code);
    this.page = 1;
    this.updateUrl();
  }

  removeShariah(val: string): void {
    this.shariahStatuses = this.shariahStatuses.filter(s => s !== val);
    this.page = 1;
    this.updateUrl();
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.page = 1;
      this.updateUrl();
    }, 300);
  }

  onFilterChange(): void {
    this.page = 1;
    this.updateUrl();
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.updateUrl();
  }

  onPeMinChange(val: any): void {
    this.minPe = val !== '' && val !== null ? Number(val) : null;
    this.triggerSlicerDebounce();
  }

  onPeMaxChange(val: any): void {
    this.maxPe = val !== '' && val !== null ? Number(val) : null;
    this.triggerSlicerDebounce();
  }

  onPbMinChange(val: any): void {
    this.minPb = val !== '' && val !== null ? Number(val) : null;
    this.triggerSlicerDebounce();
  }

  onPbMaxChange(val: any): void {
    this.maxPb = val !== '' && val !== null ? Number(val) : null;
    this.triggerSlicerDebounce();
  }

  clearPeFilter(): void {
    this.minPe = null;
    this.maxPe = null;
    this.page = 1;
    this.updateUrl();
  }

  clearPbFilter(): void {
    this.minPb = null;
    this.maxPb = null;
    this.page = 1;
    this.updateUrl();
  }

  private triggerSlicerDebounce(): void {
    if (this.slicerDebounceTimer) clearTimeout(this.slicerDebounceTimer);
    this.slicerDebounceTimer = setTimeout(() => {
      this.page = 1;
      this.updateUrl();
    }, 400);
  }

  clearFilter(key: string): void {
    if (key === 'priceComparison') this.priceComparison = '';
    if (key === 'minCompliantSources') this.minCompliantSources = '';
    if (key === 'nonComplianceType') this.nonComplianceType = '';
    this.page = 1;
    this.updateUrl();
  }

  setPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.updateUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateUrl(): void {
    const queryParams: any = {
      page: this.page > 1 ? this.page : null,
      pageSize: this.pageSize !== 18 ? this.pageSize : null,
      search: this.search || null,
      indexCodes: this.indexCodes.length ? this.indexCodes.join(',') : null,
      shariahStatuses: this.shariahStatuses.length ? this.shariahStatuses.join(',') : null,
      priceComparison: this.priceComparison || null,
      minCompliantSources: this.minCompliantSources || null,
      minPe: this.minPe !== null ? this.minPe : null,
      maxPe: this.maxPe !== null ? this.maxPe : null,
      minPb: this.minPb !== null ? this.minPb : null,
      maxPb: this.maxPb !== null ? this.maxPb : null,
      nonComplianceType: this.nonComplianceType || null,
      sortBy: this.sortBy !== 'changePct' ? this.sortBy : null,
      sortDir: this.sortDir !== 'desc' ? this.sortDir : null,
      view: this.view !== 'grid' ? this.view : null
    };

    navigateQueryParams(this.router, this.route, queryParams);
  }

  setView(v: EntityView): void {
    if (this.view === v) return;
    this.view = v;
    this.updateUrl();
  }

  get unweightedCount(): number {
    if (!this.allSectorStocks?.length) return 0;
    const filtered = this.filterSectorStocks(this.allSectorStocks);
    return filtered.filter(s => s.weight === null || s.weight === undefined || Number(s.weight) <= 0).length;
  }

  get treemapItems(): TreemapItem[] {
    if (!this.allSectorStocks?.length) return [];
    const list = this.filterSectorStocks(this.allSectorStocks);

    // Only draw items that have a positive weight
    return list
      .filter(s => s.weight !== null && s.weight !== undefined && Number(s.weight) > 0)
      .map(s => {
        const weight = Number(s.weight);
        const priceText = s.closingPrice != null ? `${Number(s.closingPrice).toFixed(2)} ج.م` : '';
        const shariahLabel = s.shariahStatus ? this.getShariahLabel(s.shariahStatus) : '—';
        const changeText = s.changePct != null ? `${s.changePct > 0 ? '+' : ''}${Number(s.changePct).toFixed(2)}%` : '—';

        return {
          id: s.ticker,
          label: s.ticker,
          subLabel: priceText,
          value: weight,
          changePct: s.changePct,
          price: s.closingPrice,
          weightPct: s.weight,
          shariahStatus: s.shariahStatus,
          link: ['/stocks', s.ticker],
          tooltip: `${s.nameAr || s.ticker} (${s.ticker})\nالسعر: ${priceText || '—'}\nالتغير: ${changeText}\nالوزن في القطاع: ${weight.toFixed(2)}%\nالحكم الشرعي: ${shariahLabel}`
        };
      });
  }

  private filterSectorStocks(all: StockListItemDto[]): StockListItemDto[] {
    let list = all;

    // Filter by search
    if (this.search) {
      const q = this.search.trim().toLowerCase();
      list = list.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        (s.nameAr && s.nameAr.includes(q)) ||
        (s.nameEn && s.nameEn.toLowerCase().includes(q))
      );
    }

    // Filter by tabs (quick filter)
    if (this.activeTab === 'compliant') {
      list = list.filter(s => normalizeStatusValue(s.shariahStatus) === 'compliant');
    } else if (this.activeTab === 'cheap') {
      list = list.filter(s => s.priceComparison === 'Cheap');
    }

    // Filter by Shariah statuses
    if (this.shariahStatuses.length > 0) {
      list = list.filter(s => s.shariahStatus && this.shariahStatuses.includes(s.shariahStatus));
    }

    // Filter by valuation
    if (this.priceComparison) {
      list = list.filter(s => s.priceComparison === this.priceComparison);
    }

    // Filter by non-compliance type
    if (this.nonComplianceType && this.shariahStatuses.includes('NonCompliant')) {
      list = list.filter(s => matchesNonComplianceType(s, this.nonComplianceType));
    }

    // Filter by PE / PB
    if (this.minPe !== null) list = list.filter(s => s.peRatio !== null && s.peRatio !== undefined && s.peRatio >= this.minPe!);
    if (this.maxPe !== null) list = list.filter(s => s.peRatio !== null && s.peRatio !== undefined && s.peRatio <= this.maxPe!);
    if (this.minPb !== null) list = list.filter(s => s.pbRatio !== null && s.pbRatio !== undefined && s.pbRatio >= this.minPb!);
    if (this.maxPb !== null) list = list.filter(s => s.pbRatio !== null && s.pbRatio !== undefined && s.pbRatio <= this.maxPb!);

    return list;
  }
}
