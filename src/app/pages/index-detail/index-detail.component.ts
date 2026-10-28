import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EMPTY, expand, map, reduce } from 'rxjs';
import { LucideAngularModule, Layers, ShieldCheck, TrendingUp, Flame } from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { SessionCacheService } from '../../services/session-cache.service';
import { navigateQueryParams } from '../../utils/navigation-utils';
import { ConstituentItemDto, IndexConstituentsPagedResultDto, MarketSnapshotDto } from '../../models/api.models';
import { normalizeStatusValue } from '../../models/shariah-standards';
import { MzListingPageComponent, type MzListingConfig } from '../../components/ui/ui-listing-page';
import { stockToCard } from '../../components/ui/ui-mappers';
import { MzSelectComponent, type MzStat, type MzOption } from '../../components/ui/ui-small';

import { ViewSwitcherComponent, type EntityView } from '../../components/view-switcher/view-switcher.component';
import { TreemapComponent, type TreemapItem } from '../../components/treemap/treemap.component';

@Component({
  selector: 'app-index-detail',
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
          sizeNote="حجم كل مربع يمثل الوزن النسبي للسهم في المؤشر">
        </app-treemap>
      </ng-container>

      <div resultsExtra class="mz-active-filters">
        <span class="mz-badge pill neutral" *ngFor="let st of shariahStatuses">الحكم: {{ getShariahLabel(st) }} <button type="button" class="mz-x" (click)="removeShariah(st)" aria-label="إزالة">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="priceComparison">التقييم: {{ getPriceComparisonLabel(priceComparison) }} <button type="button" class="mz-x" (click)="clearFilter('priceComparison')" aria-label="إزالة">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="minCompliantSources">الجهات: ≥ {{ minCompliantSources }} <button type="button" class="mz-x" (click)="clearFilter('minCompliantSources')" aria-label="إزالة">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="minPe !== null || maxPe !== null">مكرر الربحية: {{ minPe ?? 0 }} - {{ maxPe ?? '∞' }} <button type="button" class="mz-x" (click)="clearPeFilter()" aria-label="إزالة">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="minPb !== null || maxPb !== null">مضاعف الدفترية: {{ minPb ?? 0 }} - {{ maxPb ?? '∞' }} <button type="button" class="mz-x" (click)="clearPbFilter()" aria-label="إزالة">×</button></span>
      </div>

      <div advanced class="mz-adv-grid">
        <!-- Right Column: Stacked authorities dropdown + results per page -->
        <div class="mz-adv-col">
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
export class IndexDetailComponent implements OnInit, OnDestroy {
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

  code = '';
  result?: IndexConstituentsPagedResultDto | null;
  allConstituents: ConstituentItemDto[] = [];
  kpisLoading = true;
  loading = true;
  loadError = false;
  advancedOpen = false;

  view: EntityView = 'grid';
  page = 1;
  pageSize = 20;
  search = '';
  shariahStatuses: string[] = [];
  priceComparison = '';
  minCompliantSources = '';
  sortBy = 'weight';
  sortDir = 'desc';

  minPe: number | null = null;
  maxPe: number | null = null;
  minPb: number | null = null;
  maxPb: number | null = null;

  config: MzListingConfig = {
    header: { badge: 'مؤشر البورصة الرسمية', title: 'المؤشر', description: '' },
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

  get hasWeights(): boolean {
    const items = this.result?.items;
    return !!items && items.some((it) => it.weight != null && it.weight !== 0);
  }

  get sortFields() {
    const list = [];
    if (this.hasWeights) {
      list.push({ value: 'weight', label: 'الوزن النسبي' });
    }
    list.push(
      { value: 'changePct', label: 'نسبة التغير' },
      { value: 'closingPrice', label: 'سعر الإغلاق' },
      { value: 'fairValueDiffPct', label: 'فارق القيمة العادلة' },
      { value: 'ticker', label: 'رمز السهم' }
    );
    return list;
  }

  snapshot?: MarketSnapshotDto | null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.code = params.get('code') || '';
      if (this.code) {
        this.loadSnapshot();
        this.loadIndexKpis();
      } else {
        this.kpisLoading = false;
      }
    });

    this.route.queryParams.subscribe((params) => {
      if (this.code) {
        const saved = this.cache.getUiState<any>('index-detail-' + this.code);
        if (saved && !Object.keys(params).length) {
          this.page = saved.page || 1;
          this.pageSize = saved.pageSize || 20;
          this.search = saved.search || '';
          this.shariahStatuses = saved.shariahStatuses || [];
          this.priceComparison = saved.priceComparison || '';
          this.minCompliantSources = saved.minCompliantSources || '';
          this.minPe = saved.minPe ?? null;
          this.maxPe = saved.maxPe ?? null;
          this.minPb = saved.minPb ?? null;
          this.maxPb = saved.maxPb ?? null;
          this.sortBy = saved.sortBy || 'weight';
          this.sortDir = saved.sortDir || 'desc';
          this.advancedOpen = saved.advancedOpen || false;
          this.view = saved.view || 'grid';
          this.loadConstituents();
          return;
        }
      }

      this.page = params['page'] ? Number(params['page']) : 1;
      this.pageSize = params['pageSize'] ? Number(params['pageSize']) : 20;
      this.search = params['search'] || '';

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
      this.sortBy = params['sortBy'] || 'weight';
      this.sortDir = params['sortDir'] || 'desc';

      this.minPe = params['minPe'] !== undefined && params['minPe'] !== null ? Number(params['minPe']) : null;
      this.maxPe = params['maxPe'] !== undefined && params['maxPe'] !== null ? Number(params['maxPe']) : null;
      this.minPb = params['minPb'] !== undefined && params['minPb'] !== null ? Number(params['minPb']) : null;
      this.maxPb = params['maxPb'] !== undefined && params['maxPb'] !== null ? Number(params['maxPb']) : null;
      if (params['view'] === 'heatmap' || params['view'] === 'grid') {
        this.view = params['view'];
      }

      if (this.code) {
        this.loadConstituents();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.code) {
      this.cache.saveScroll('index-detail-' + this.code, window.scrollX, window.scrollY);
      this.cache.saveUiState('index-detail-' + this.code, {
        page: this.page,
        pageSize: this.pageSize,
        search: this.search,
        shariahStatuses: this.shariahStatuses,
        priceComparison: this.priceComparison,
        minCompliantSources: this.minCompliantSources,
        minPe: this.minPe,
        maxPe: this.maxPe,
        minPb: this.minPb,
        maxPb: this.maxPb,
        sortBy: this.sortBy,
        sortDir: this.sortDir,
        advancedOpen: this.advancedOpen,
        view: this.view
      });
    }
  }

  private loadSnapshot(): void {
    const cached = this.cache.get<MarketSnapshotDto[]>('indices_snapshots');
    if (cached?.data?.length) {
      this.snapshot = cached.data.find(s => s.kind === 'Index' && s.code?.toUpperCase() === this.code?.toUpperCase()) ?? null;
      this.rebuild();
      return;
    }
    this.api.getMarketSnapshots().subscribe({
      next: (rows) => {
        if (rows?.length) {
          this.cache.set('indices_snapshots', rows);
          this.snapshot = rows.find(s => s.kind === 'Index' && s.code?.toUpperCase() === this.code?.toUpperCase()) ?? null;
          this.rebuild();
        }
      },
      error: () => {}
    });
  }

  private loadIndexKpis(): void {
    if (!this.code) {
      this.kpisLoading = false;
      this.rebuild();
      return;
    }
    const kpiCacheKey = 'index_kpis_' + this.code;
    const cached = this.cache.get<ConstituentItemDto[]>(kpiCacheKey);
    if (cached) {
      this.allConstituents = cached.data || [];
      this.kpisLoading = false;
      this.rebuild();
      if (!this.cache.isStale(kpiCacheKey)) {
        return;
      }
    }

    this.api.getIndexConstituents(this.code, { page: 1, pageSize: 100 }).pipe(
      expand((res, index) => {
        const collected = (index + 1) * 100;
        return collected < (res.totalCount || 0)
          ? this.api.getIndexConstituents(this.code, { page: index + 2, pageSize: 100 })
          : EMPTY;
      }),
      map((res) => res.items || []),
      reduce((acc, items) => acc.concat(items), [] as ConstituentItemDto[])
    ).subscribe({
      next: (items) => {
        this.allConstituents = items;
        this.cache.set(kpiCacheKey, items);
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
    this.loadIndexKpis();
    this.loadConstituents();
  }

  loadConstituents(): void {
    const queryParams = {
      page: this.page,
      pageSize: this.pageSize,
      search: this.search || undefined,
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

    const cacheKey = 'index_constituents_' + this.code + '_' + JSON.stringify(queryParams);
    const cached = this.cache.get<IndexConstituentsPagedResultDto>(cacheKey);
    if (cached) {
      this.applyResult(cached.data);
      this.loadError = false;
      if (this.code) {
        this.cache.restoreScroll('index-detail-' + this.code);
      }
      if (!this.cache.isStale(cacheKey)) {
        return;
      }
    } else {
      this.loading = true;
      this.loadError = false;
      this.rebuild();
    }

    this.api.getIndexConstituents(this.code, queryParams).subscribe({
      next: (data) => {
        this.cache.set(cacheKey, data);
        this.loadError = false;
        this.applyResult(data);
      },
      error: () => {
        if (!cached) {
          this.result = null;
          this.loadError = true;
        }
        this.loading = false;
        this.rebuild();
      }
    });
  }

  private applyResult(data: IndexConstituentsPagedResultDto): void {
    this.result = data;
    this.loading = false;
    if (!this.hasWeights && this.sortBy === 'weight') {
      this.sortBy = 'ticker';
      this.sortDir = 'asc';
      this.page = 1;
      this.updateUrl();
      return;
    }
    this.rebuild();
  }

  get stats(): MzStat[] {
    const totalCount = this.allConstituents.length || this.result?.totalCount;
    const items = this.allConstituents.length ? this.allConstituents : (this.result?.items || []);

    const compliantCount = this.allConstituents.length
      ? items.filter(s => normalizeStatusValue(s.shariahStatus) === 'compliant').length
      : null;
    const compliantPct = compliantCount != null && totalCount && totalCount > 0
      ? Math.round((compliantCount / totalCount) * 100)
      : null;

    const cheapCount = this.allConstituents.length
      ? items.filter(s => s.priceComparison === 'Cheap').length
      : null;

    const validPerformers = items.filter(s => s.changePct !== null && s.changePct !== undefined);
    const top = validPerformers.length
      ? validPerformers.reduce((best, cur) => ((cur.changePct || 0) > (best.changePct || 0) ? cur : best))
      : null;

    return [
      {
        label: 'إجمالي الأسهم المكونة',
        value: totalCount != null ? String(totalCount) : '—',
        icon: this.LayersIcon,
        chip: 'مكوّن'
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
    if (e.id === 'shariah') {
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
    const activeFilterCount = (this.minCompliantSources ? 1 : 0) +
      (this.minPe !== null || this.maxPe !== null ? 1 : 0) +
      (this.minPb !== null || this.maxPb !== null ? 1 : 0) +
      (this.pageSize !== 20 ? 1 : 0);

    const totalCountVal = this.result?.totalCount;

    const snap = this.snapshot;
    let quoteLine = '';
    if (snap?.value != null) {
      const val = Number(snap.value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
      const chgPts = snap.change != null
        ? `${snap.change > 0 ? '+' : ''}${Number(snap.change).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`
        : '';
      const chgPct = snap.changePct != null ? `${snap.changePct > 0 ? '+' : ''}${Number(snap.changePct).toFixed(2)}%` : '';
      const perfParts = [chgPts, chgPct].filter(Boolean).join(' · ');
      quoteLine = ` · ${val} نقطة${perfParts ? ' (' + perfParts + ')' : ''}`;
    }

    this.config = {
      backLink: { label: 'العودة إلى المؤشرات', to: '/indices' },
      header: {
        badge: 'مؤشر البورصة الرسمية',
        count: totalCountVal ? `${totalCountVal} سهم` : '',
        title: this.result?.indexNameAr || this.result?.indexCode || this.code,
        description: `${this.result?.indexNameEn || ''}${this.result?.indexNameEn ? ' · ' : ''}كود المؤشر: ${this.result?.indexCode || this.code}${quoteLine}`
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
        searchPlaceholder: 'ابحث في أسهم المؤشر باسم السهم أو رمزه...',
        controls: [
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
          ? `${this.treemapItems.length} سهم معروض في الخريطة الحرارية للمؤشر`
          : `${this.result?.totalCount || 0} سهم مكوّن (الصفحة ${this.page} من ${this.result?.totalPages || 1})`,
        legend: [{ label: 'متوافق', tone: 'good' }, { label: 'غير متوافق', tone: 'bad' }]
      },
      cards: (this.result?.items || []).map((s) => stockToCard(s, { parent: 'index' })),
      skeletonCount: this.pageSize,
      cardType: 'stock',
      loading: this.loading && !this.loadError,
      error: !this.loading && this.loadError
        ? { title: 'تعذّر تحميل أسهم المؤشر', message: 'تحقق من الاتصال بالشبكة ثم حاول مرة أخرى.' }
        : (!this.loading && !this.result ? { title: 'المؤشر غير موجود', message: 'لم يتم العثور على بيانات هذا المؤشر.' } : null),
      empty: {
        title: 'لا توجد نتائج مطابقة للفلاتر المختارة',
        message: 'جرّب تعديل خيارات البحث أو إزالة أحد الفلاتر لتوسيع نطاق النتائج.'
      },
      page: this.page,
      totalPages: this.result?.totalPages || 1
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
    }, 350);
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
    this.page = 1;
    this.updateUrl();
  }

  setPage(p: number): void {
    if (!this.result || p < 1 || p > this.result.totalPages || p === this.page) return;
    this.page = p;
    this.updateUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateUrl(): void {
    const queryParams: any = {
      page: this.page > 1 ? this.page : null,
      pageSize: this.pageSize !== 20 ? this.pageSize : null,
      search: this.search || null,
      shariahStatuses: this.shariahStatuses.length ? this.shariahStatuses.join(',') : null,
      priceComparison: this.priceComparison || null,
      minCompliantSources: this.minCompliantSources || null,
      minPe: this.minPe !== null ? this.minPe : null,
      maxPe: this.maxPe !== null ? this.maxPe : null,
      minPb: this.minPb !== null ? this.minPb : null,
      maxPb: this.maxPb !== null ? this.maxPb : null,
      sortBy: this.sortBy !== 'weight' ? this.sortBy : null,
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
    if (!this.allConstituents?.length) return 0;
    const filtered = this.filterConstituents(this.allConstituents);
    return filtered.filter(s => s.weight === null || s.weight === undefined || Number(s.weight) <= 0).length;
  }

  get treemapItems(): TreemapItem[] {
    if (!this.allConstituents?.length) return [];
    const list = this.filterConstituents(this.allConstituents);

    // If an index has NO constituent weights recorded yet (e.g. EGX100, EGX70),
    // use equal weight (1) so all constituent tiles are drawn proportionally instead of dropped.
    // If an index has real weights (e.g. EGX30, EGX33, EGX35-LV), respect real weights and track unweighted.
    const hasAnyRealWeight = list.some(s => s.weight !== null && s.weight !== undefined && Number(s.weight) > 0);

    const validList = hasAnyRealWeight
      ? list.filter(s => s.weight !== null && s.weight !== undefined && Number(s.weight) > 0)
      : list;

    return validList.map(s => {
      const weight = hasAnyRealWeight ? Number(s.weight) : 1;
      const priceText = s.closingPrice != null ? `${Number(s.closingPrice).toFixed(2)} ج.م` : '';
      const shariahLabel = s.shariahStatus ? this.getShariahLabel(s.shariahStatus) : '—';
      const changeText = s.changePct != null ? `${s.changePct > 0 ? '+' : ''}${Number(s.changePct).toFixed(2)}%` : '—';
      const weightDisplay = s.weight != null && Number(s.weight) > 0 ? `${Number(s.weight).toFixed(2)}%` : 'متساوي';

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
        tooltip: `${s.nameAr || s.ticker} (${s.ticker})\nالسعر: ${priceText || '—'}\nالتغير: ${changeText}\nالوزن في المؤشر: ${weightDisplay}\nالحكم الشرعي: ${shariahLabel}`
      };
    });
  }

  private filterConstituents(all: ConstituentItemDto[]): ConstituentItemDto[] {
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

    return list;
  }
}
