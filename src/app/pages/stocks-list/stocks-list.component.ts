import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Layers, ShieldCheck, TrendingUp, Flame } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { SessionCacheService } from '../../services/session-cache.service';
import { navigateQueryParams } from '../../utils/navigation-utils';
import { IndexSummaryDto, PagedResult, StockListItemDto } from '../../models/api.models';
import { matchesNonComplianceType, getNonComplianceReasons, normalizeStatusValue } from '../../models/shariah-standards';
import { MzListingPageComponent, type MzListingConfig } from '../../components/ui/ui-listing-page';
import { comparisonRibbon, fmtNumber, pctTone, signedPct, statusTag, stockToCard } from '../../components/ui/ui-mappers';
import type { MzListingCardData } from '../../components/ui/ui-listing';
import type { MzStat, MzOption } from '../../components/ui/ui-small';
import { MzSelectComponent } from '../../components/ui/ui-small';

@Component({
  selector: 'app-stocks-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MzListingPageComponent, MzSelectComponent],
  template: `
    <mz-listing-page
      [config]="config"
      (tabChange)="onTabChange($event)"
      (searchChange)="onSearchInput($event)"
      (controlChange)="onControlChange($event)"
      (sortChange)="onSortSelect($event)"
      (advancedClick)="advancedOpen = !advancedOpen; rebuild()"
      (pageChange)="setPage($event)"
      (retry)="fetchStocks()">

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
export class StocksListComponent implements OnInit, OnDestroy {
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
    { value: 20, label: '20' },
    { value: 50, label: '50' },
    { value: 100, label: '100' }
  ];

  /** Config object consumed by the shared ListingPage; rebuilt whenever state changes. */
  config: MzListingConfig = {
    header: { badge: 'البورصة المصرية', title: 'الأسهم', description: '' },
    cards: [],
    empty: { title: '', message: '' }
  };
  advancedOpen = false;

  stocks: StockListItemDto[] = [];
  indices: IndexSummaryDto[] = [];
  totalCount = 0;
  totalPages = 1;
  loading = false;
  loadError = false;

  // KPI summary stats (A_BASE_stocks reference)
  marketTotalStocks: number | null = null;
  marketCompliantCount: number | null = null;
  marketCompliantPct: number | null = null;
  marketCheapCount: number | null = null;
  topPerformer: { ticker: string; nameAr?: string | null; changePct: number } | null = null;
  kpisLoading = true;

  // Filter params
  page = 1;
  pageSize = 20; // Default 20
  search = '';
  indexCodes: string[] = [];
  shariahStatuses: string[] = [];
  priceComparison = '';
  minCompliantSources = '';
  sortBy = 'changePct';
  sortDir = 'desc';

  // PE & PB filters
  minPe: number | null = null;
  maxPe: number | null = null;
  minPb: number | null = null;
  maxPb: number | null = null;

  /** Client-side sub-filter for non-compliance type: '' | 'activity' | 'ratios' */
  nonComplianceType = '';

  private searchDebounceTimer?: any;
  private slicerDebounceTimer?: any;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cache: SessionCacheService
  ) {
    this.rebuild();
  }

  ngOnInit(): void {
    const saved = this.cache.getUiState<any>('stocks-list');
    if (saved && !this.route.snapshot.queryParamMap.keys.length) {
      this.page = saved.page || 1;
      this.pageSize = saved.pageSize || 20;
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
    }

    this.loadMarketKpis();

    this.api.getIndices().subscribe({
      next: (data) => { this.indices = data || []; this.rebuild(); }
    });

    this.route.queryParams.subscribe((params) => {
      this.page = params['page'] ? Number(params['page']) : 1;
      this.pageSize = params['pageSize'] ? Number(params['pageSize']) : 20;
      this.search = params['search'] || '';

      // Index codes: support comma-delimited or array or legacy single indexCode
      if (params['indexCodes']) {
        const val = params['indexCodes'];
        this.indexCodes = Array.isArray(val)
          ? val
          : String(val).split(',').map(s => s.trim()).filter(Boolean);
      } else if (params['indexCode']) {
        this.indexCodes = [String(params['indexCode']).trim()];
      } else {
        this.indexCodes = [];
      }

      // Shariah statuses: support comma-delimited or array or legacy single shariahStatus
      if (params['shariahStatuses']) {
        const val = params['shariahStatuses'];
        this.shariahStatuses = Array.isArray(val)
          ? val
          : String(val).split(',').map(s => s.trim()).filter(Boolean);
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

      this.fetchStocks();
    });
  }

  ngOnDestroy(): void {
    this.cache.saveScroll('stocks-list', window.scrollX, window.scrollY);
    this.cache.saveUiState('stocks-list', {
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
      advancedOpen: this.advancedOpen
    });
  }

  loadMarketKpis(): void {
    const cached = this.cache.get<any>('stocks_market_kpis');
    if (cached) {
      this.marketTotalStocks = cached.data.total;
      this.marketCompliantCount = cached.data.compliant;
      this.marketCompliantPct = cached.data.compliantPct;
      this.marketCheapCount = cached.data.cheap;
      this.topPerformer = cached.data.top;
      this.kpisLoading = false;
      this.rebuild();
      if (!this.cache.isStale('stocks_market_kpis')) {
        return;
      }
    }

    this.kpisLoading = !cached;
    forkJoin({
      all: this.api.getStocks({ pageSize: 1 }),
      compliant: this.api.getStocks({ pageSize: 1, shariahStatuses: ['Compliant'] }),
      cheap: this.api.getStocks({ pageSize: 1, priceComparison: 'Cheap' }),
      top: this.api.getStocks({ pageSize: 1, sortBy: 'changePct', sortDir: 'desc' })
    }).subscribe({
      next: (res) => {
        this.marketTotalStocks = res.all.totalCount || 0;
        this.marketCompliantCount = res.compliant.totalCount || 0;
        this.marketCompliantPct = this.marketTotalStocks > 0
          ? Math.round((this.marketCompliantCount / this.marketTotalStocks) * 1000) / 10
          : null;
        this.marketCheapCount = res.cheap.totalCount || 0;
        const topItem = res.top.items && res.top.items[0];
        this.topPerformer = topItem && topItem.changePct !== null && topItem.changePct !== undefined
          ? { ticker: topItem.ticker, nameAr: topItem.nameAr, changePct: Number(topItem.changePct) }
          : null;

        this.cache.set('stocks_market_kpis', {
          total: this.marketTotalStocks,
          compliant: this.marketCompliantCount,
          compliantPct: this.marketCompliantPct,
          cheap: this.marketCheapCount,
          top: this.topPerformer
        });

        this.kpisLoading = false;
        this.rebuild();
      },
      error: () => {
        this.kpisLoading = false;
        this.rebuild();
      }
    });
  }

  get kpiStats(): MzStat[] {
    return [
      {
        label: 'إجمالي الأسهم',
        value: this.marketTotalStocks !== null ? String(this.marketTotalStocks) : (this.totalCount ? String(this.totalCount) : '—'),
        icon: this.LayersIcon,
        chip: '100% السوق'
      },
      {
        label: 'متوافق شرعاً',
        value: this.marketCompliantCount !== null ? String(this.marketCompliantCount) : '—',
        icon: this.ShieldCheckIcon,
        chip: this.marketCompliantPct !== null ? `${this.marketCompliantPct}%` : '—'
      },
      {
        label: 'فرص صعود للعادل',
        value: this.marketCheapCount !== null ? String(this.marketCheapCount) : '—',
        icon: this.TrendingUpIcon,
        chip: 'أرخص'
      },
      {
        label: 'أعلى أداء اليوم',
        value: this.topPerformer ? `${this.topPerformer.changePct > 0 ? '+' : ''}${this.topPerformer.changePct.toFixed(2)}%` : '—',
        icon: this.FlameIcon,
        chip: this.topPerformer ? (this.topPerformer.ticker || this.topPerformer.nameAr) : '—'
      }
    ];
  }

  // ── Shared-component event adapters (thin: they only call the existing handlers) ──
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

  onSearchInput(value: string): void {
    this.search = value;
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

  onSortSelect(value: string): void {
    const [field, dir] = value.split(':');
    this.sortBy = field;
    this.sortDir = dir;
    this.onSortFieldChange();
  }

  get activeTab(): string {
    const noOther = !this.nonComplianceType;
    if (this.priceComparison === 'Cheap' && !this.shariahStatuses.length && noOther) return 'cheap';
    if (this.shariahStatuses.length === 1 && this.shariahStatuses[0] === 'Compliant' && !this.priceComparison && noOther) return 'compliant';
    if (!this.shariahStatuses.length && !this.priceComparison) return 'all';
    return '';
  }

  private readonly sortFields = [
    { value: 'changePct', label: 'نسبة التغير' },
    { value: 'closingPrice', label: 'السعر' },
    { value: 'fairValueDiffPct', label: 'فارق العادلة' },
    { value: 'ticker', label: 'رمز السهم' }
  ];

  /** Builds the single config object the ListingPage renders. */
  rebuild(): void {
    const activeFilterCount =
      (this.nonComplianceType ? 1 : 0) + (this.minCompliantSources ? 1 : 0) +
      (this.minPe !== null || this.maxPe !== null ? 1 : 0) + (this.minPb !== null || this.maxPb !== null ? 1 : 0);
    this.config = {
      header: {
        badge: 'البورصة المصرية',
        count: `${this.totalCount} سهم متوفر`,
        title: 'الأسهم',
        description: 'ابحث، صفِّ، وقارن تقييمات الأسهم وأحكام الشريعة بناءً على بيانات المؤشرات ونماذج القيمة العادلة المعتمدة.'
      },
      stats: this.kpiStats,
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
        searchPlaceholder: 'ابحث باسم السهم أو رمزه (مثال: COMI أو فوري)...',
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
        text: `${this.totalCount} نتيجة مطابقة (الصفحة ${this.page} من ${this.totalPages || 1})`,
        legend: [{ label: 'متوافق', tone: 'good' }, { label: 'غير متوافق', tone: 'bad' }]
      },
      cards: this.displayedStocks.map((s) => stockToCard(s)),
      skeletonCount: this.pageSize,
      cardType: 'stock',
      loading: this.loading && !this.loadError,
      error: !this.loading && this.loadError ? { title: 'تعذّر تحميل الأسهم', message: 'تحقق من الاتصال بالشبكة ثم حاول مرة أخرى.' } : null,
      empty: {
        title: 'لا توجد نتائج مطابقة للفلاتر المختارة',
        message: 'جرّب تعديل خيارات البحث أو إزالة أحد الفلاتر لتوسيع نطاق النتائج.'
      },
      page: this.page,
      totalPages: this.totalPages
    };
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

  allFetchedStocks: StockListItemDto[] = [];
  rawTotalCount = 0;

  get isNonComplianceFiltered(): boolean {
    return !!(this.nonComplianceType && this.shariahStatuses.includes('NonCompliant'));
  }

  fetchStocks(): void {
    const queryStatuses = this.shariahStatuses;
    const queryPageSize = this.isNonComplianceFiltered ? 200 : this.pageSize;
    const queryPage = this.isNonComplianceFiltered ? 1 : this.page;

    const cacheKey = 'stocks_query_' + JSON.stringify({
      page: queryPage,
      pageSize: queryPageSize,
      search: this.search || '',
      indexCodes: this.indexCodes,
      shariahStatuses: queryStatuses,
      priceComparison: this.priceComparison,
      minCompliantSources: this.minCompliantSources,
      minPe: this.minPe,
      maxPe: this.maxPe,
      minPb: this.minPb,
      maxPb: this.maxPb,
      sortBy: this.sortBy,
      sortDir: this.sortDir
    });

    const cached = this.cache.get<PagedResult<StockListItemDto>>(cacheKey);
    if (cached) {
      this.applyStocksResult(cached.data);
      this.loading = false;
      this.loadError = false;
      this.rebuild();
      this.cache.restoreScroll('stocks-list');
      if (!this.cache.isStale(cacheKey)) {
        return;
      }
    } else {
      this.loading = true;
      this.loadError = false;
      this.rebuild();
    }

    this.api.getStocks({
      page: queryPage,
      pageSize: queryPageSize,
      search: this.search || undefined,
      indexCodes: this.indexCodes.length ? this.indexCodes : undefined,
      shariahStatuses: queryStatuses.length ? queryStatuses : undefined,
      priceComparison: this.priceComparison || undefined,
      minCompliantSources: this.minCompliantSources ? Number(this.minCompliantSources) : undefined,
      minPeRatio: this.minPe !== null ? this.minPe : undefined,
      maxPeRatio: this.maxPe !== null ? this.maxPe : undefined,
      minPbRatio: this.minPb !== null ? this.minPb : undefined,
      maxPbRatio: this.maxPb !== null ? this.maxPb : undefined,
      sortBy: this.sortBy,
      sortDir: this.sortDir
    }).subscribe({
      next: (res) => {
        this.cache.set(cacheKey, res);
        this.applyStocksResult(res);
        this.loading = false;
        this.loadError = false;
        this.rebuild();
        if (cached) {
          this.cache.restoreScroll('stocks-list');
        }
      },
      error: () => {
        if (!cached) {
          this.stocks = [];
          this.totalCount = 0;
          this.totalPages = 1;
          this.loading = false;
          this.loadError = true;
          this.rebuild();
        }
      }
    });
  }

  private applyStocksResult(res: PagedResult<StockListItemDto>): void {
    this.stocks = res.items || [];
    this.rawTotalCount = res.totalCount || 0;

    if (this.isNonComplianceFiltered) {
      const filtered = this.stocks.filter((s) => matchesNonComplianceType(s, this.nonComplianceType));
      this.totalCount = filtered.length;
      this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
      if (this.page > this.totalPages) {
        this.page = 1;
      }
    } else {
      this.totalCount = res.totalCount || 0;
      this.totalPages = res.totalPages || Math.ceil(this.totalCount / this.pageSize) || 1;
    }
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.page = 1;
      this.updateUrl();
    }, 350);
  }

  onFilterChange(): void {
    this.page = 1;
    this.updateUrl();
  }

  onSortFieldChange(): void {
    this.page = 1;
    this.updateUrl();
  }

  onSortDirChange(): void {
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
      pageSize: this.pageSize !== 20 ? this.pageSize : null,
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
      sortDir: this.sortDir !== 'desc' ? this.sortDir : null
    };

    // Clean null fields from route. replaceUrl + equality guard live in
    // the helper so Back always leaves the page instead of looping params.
    navigateQueryParams(this.router, this.route, queryParams);
  }

  /** Displayed stocks: when the nonComplianceType sub-filter is active, filters and paginates client-side. */
  get displayedStocks() {
    if (this.isNonComplianceFiltered) {
      const filtered = this.stocks.filter((s) => matchesNonComplianceType(s, this.nonComplianceType));
      const start = (this.page - 1) * this.pageSize;
      return filtered.slice(start, start + this.pageSize);
    }
    return this.stocks;
  }
}