import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { navigateQueryParams } from '../../utils/navigation-utils';
import { LucideAngularModule, Search, ChevronDown, ShieldCheck, TrendingUp, Star, Building2, DollarSign, AlertCircle, SlidersHorizontal, RotateCcw, X } from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { SessionCacheService } from '../../services/session-cache.service';
import { FundListItemDto, FundPagedResultDto, FundListFilter, FundType, FundClassificationTreeNode, FundAssetManagerOption } from '../../models/api.models';
import {
  normFundType,
  normFundRiskLevel,
  fundRiskLabelAr,
  fundLogoUrl,
  FUND_SHARIA_BADGE_TOOLTIP
} from '../../models/fund-display';
import { MzListingPageComponent, type MzListingConfig } from '../../components/ui/ui-listing-page';
import { MzSelectComponent, type MzOption } from '../../components/ui/ui-small';
import type { MzListingCardData } from '../../components/ui/ui-listing';
import { ClassificationCascadeComponent } from '../../components/classification-cascade/classification-cascade.component';
import { type EntityStat } from '../../components/entity-card/entity-card.component';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, Subscription, timeout, catchError, of } from 'rxjs';
import { KpiStripComponent, KpiData } from '../../components/kpi-strip/kpi-strip.component';

@Component({
  selector: 'app-funds-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ClassificationCascadeComponent, MzListingPageComponent, MzSelectComponent],
    template: `
    <mz-listing-page
      [config]="config"
      (tabChange)="setChip($event)"
      (searchChange)="onSearchInput($event)"
      (sortChange)="onSortChangeSelect($event)"
      (advancedClick)="toggleAdvanced(); rebuild()"
      (pageChange)="goToPage($event)"
      (retry)="loadFunds()">

      <div resultsExtra class="mz-active-filters" *ngIf="hasActiveFilters">
        <span class="mz-badge pill neutral" *ngIf="filter.search">البحث: {{ filter.search }} <button type="button" class="mz-x" (click)="removeSearchFilter()" aria-label="حذف بحث">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="activeNodeName">التصنيف: {{ activeNodeName }} <button type="button" class="mz-x" (click)="removeNodeFilter()" aria-label="حذف فلتر التصنيف">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="activeManagerName">المدير: {{ activeManagerName }} <button type="button" class="mz-x" (click)="removeManagerFilter()" aria-label="حذف فلتر المدير">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="filter.riskLevel">المخاطر: {{ filter.riskLevel === 'low' ? 'منخفضة' : filter.riskLevel === 'medium' ? 'متوسطة' : 'عالية' }} <button type="button" class="mz-x" (click)="removeRiskFilter()" aria-label="حذف فلتر المخاطر">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="filter.isIslamic !== undefined">الحكم: {{ filter.isIslamic ? 'متوافق شرعاً' : 'غير متوافق' }} <button type="button" class="mz-x" (click)="removeShariaFilter()" aria-label="حذف فلتر التوافق الشرعي">×</button></span>
        <button type="button" class="mz-btn" style="padding:2px 8px;font-size:11px" (click)="resetFilters()">مسح الفلاتر</button>
      </div>

      <div advanced class="mz-adv-grid">
        <div style="grid-column: 1 / -1">
          <app-classification-cascade
            [tree]="classTree"
            [path]="classPath"
            rootLabel="نوع الصندوق"
            allLabel="كل الأنواع"
            (pathChange)="onClassPathChange($event)">
          </app-classification-cascade>
        </div>
        <div class="mz-slicer">
          <span class="mz-slicer-head"><span>الشركة المسؤولة (مدير الأصول)</span></span>
          <mz-select
            [options]="assetManagerOptions"
            [value]="filter.assetManagerId ?? null"
            (valueChange)="onManagerChange($event)"
            ariaLabel="الشركة المسؤولة عن الصندوق">
          </mz-select>
        </div>
        <div class="mz-slicer">
          <span class="mz-slicer-head"><span>مستوى المخاطر</span></span>
          <mz-select
            [options]="riskLevelOptions"
            [value]="filter.riskLevel ?? null"
            (valueChange)="onRiskChange($event)"
            ariaLabel="مستوى المخاطر">
          </mz-select>
        </div>
        <div class="mz-slicer">
          <span class="mz-slicer-head"><span>الحكم الشرعي (المصدر)</span></span>
          <mz-select
            [options]="shariaOptions"
            [value]="filter.isIslamic ?? null"
            (valueChange)="onShariaChange($event)"
            ariaLabel="الحكم الشرعي">
          </mz-select>
        </div>
      </div>

      <div footer class="mz-source-note" style="margin-top:24px">
        المصدر: <a href="https://snduk.com" target="_blank" rel="noopener" style="color:var(--mz-primary);text-decoration:underline">SNDUK</a> |
        آخر تحديث: {{ lastSyncedAt ? (lastSyncedAt | date:'yyyy-MM-dd HH:mm') : '—' }} |
        <span>إخلاء المسؤولية: البيانات للأغراض المعلوماتية فقط ولا تُعد نصيحة استثمارية.</span>
      </div>
    </mz-listing-page>
  `
})
export class FundsListComponent implements OnInit, OnDestroy {
  readonly SearchIcon = Search;
  readonly AlertCircleIcon = AlertCircle;
  readonly ChevronDownIcon = ChevronDown;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly TrendingUpIcon = TrendingUp;
  readonly StarIcon = Star;
  readonly Building2Icon = Building2;
  readonly DollarSignIcon = DollarSign;
  readonly SlidersIcon = SlidersHorizontal;
  readonly RotateIcon = RotateCcw;
  readonly XIcon = X;

  readonly shariaBadgeTooltip = FUND_SHARIA_BADGE_TOOLTIP;
  readonly normFundType = normFundType;
  readonly fundLogoUrl = fundLogoUrl;

  headerCrumbs = [{ label: 'الرئيسية', link: ['/'] }];

  funds: FundListItemDto[] = [];
  /** Public classification tree driving the cascading filters. */
  classTree: FundClassificationTreeNode[] = [];
  /** Selected classification path, root-first slugs (e.g. ['equity','sector','sector-financial']). */
  classPath: string[] = [];
  /** Distinct asset managers with fund counts from the API. */
  assetManagers: FundAssetManagerOption[] = [];
  /** Toggle state for advanced filters collapsible panel. */
  advancedOpen = false;
  /** Stale / unknown node notification text if URL provided an unknown node slug. */
  staleNodeNotice: string | null = null;

  loading = true;
  initialLoading = true;
  hasInitialized = false;
  loadError = false;
  statsLoading = true;

  filter: FundListFilter = {
    sortBy: 'return1y',
    sortDir: 'desc',
    page: 1,
    pageSize: 20
  };

  /** Bound to the search input; debounced into filter.search via searchChanged. */
  searchText = '';
  readonly searchChanged = new Subject<string>();
  private readonly fundsQuery$ = new Subject<FundListFilter & { _silent?: boolean }>();
  private querySub?: Subscription;

  currentPage = 1;
  totalPages = 0;
  totalCount = 0;

  activeChip = 'all';

  /** Quick chips defined in one config array for 100% dynamic configuration */
  readonly quickChips: Array<{ id: string; label: string; param?: string; value?: string }> = [
    { id: 'all', label: 'الكل' },
    { id: 'islamic', label: 'متوافق شرعياً', param: 'sharia', value: 'compliant' },
    { id: 'featured', label: 'مميز', param: 'featured', value: 'true' },
    { id: 'top_return', label: 'أعلى عائد', param: 'sortBy', value: 'return1y' }
  ];

  kpiList: KpiData[] = [];

  lastSyncedAt: string | null = null;

  get assetManagerOptions(): MzOption[] {
    return [
      { value: null, label: 'كل الشركات والمديرين' },
      ...this.assetManagers.map((mgr) => ({
        value: mgr.id,
        label: `${mgr.nameAr} (${mgr.fundCount})`
      }))
    ];
  }

  readonly riskLevelOptions: MzOption[] = [
    { value: null, label: 'كل المستويات' },
    { value: 'low', label: 'منخفضة' },
    { value: 'medium', label: 'متوسطة' },
    { value: 'high', label: 'عالية' }
  ];

  readonly shariaOptions: MzOption[] = [
    { value: null, label: 'الكل' },
    { value: true, label: 'متوافق شرعياً' },
    { value: false, label: 'غير متوافق' }
  ];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cache: SessionCacheService
  ) {}

  ngOnInit(): void {
    const saved = this.cache.getUiState<any>('funds-list');
    if (saved && !this.route.snapshot.queryParamMap.keys.length) {
      this.filter = saved.filter || this.filter;
      this.classPath = saved.classPath || [];
      this.searchText = saved.searchText || '';
      this.activeChip = saved.activeChip || 'all';
      this.advancedOpen = saved.advancedOpen || false;
      this.currentPage = this.filter.page || 1;
    }

    // Pipeline with switchMap so only the latest request response is applied
    this.querySub = this.fundsQuery$.pipe(
      switchMap((filter) => {
        if (!filter._silent) {
          this.loading = true;
          this.loadError = false;
          this.rebuild();
        }
        return this.api.getFunds(filter).pipe(
          timeout(15000),
          catchError((err) => {
            this.loading = false;
            this.initialLoading = false;
            this.loadError = true;
            this.rebuild();
            return of(null);
          })
        );
      })
    ).subscribe({
      next: (res: FundPagedResultDto | null) => {
        if (!res) return;
        const cacheKey = 'funds_query_' + JSON.stringify(this.filter);
        this.cache.set(cacheKey, res);
        this.funds = res.items;
        this.totalCount = res.totalCount;
        this.totalPages = res.totalPages;
        this.currentPage = res.page;
        this.loading = false;
        this.initialLoading = false;
        this.hasInitialized = true;
        this.loadError = false;
        this.updateLastSyncedAt();
        this.rebuild();
      },
      error: () => {
        this.loading = false;
        this.initialLoading = false;
        this.loadError = true;
        this.rebuild();
      }
    });

    this.searchChanged.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.filter.search = query?.trim() || undefined;
      this.filter.page = 1;
      this.currentPage = 1;
      this.loadFunds();
    });

    // Deep-link support: URL is the single source of truth.
    // Handles node=<slug>, manager=<id>, sharia=<compliant|all>, sort, dir, search, and legacy params.
    this.route.queryParamMap.subscribe(params => {
      const nodeSlug = params.get('node');
      const leafSlug = params.get('leaf');
      const subTypeSlug = params.get('subType');
      const typeSlug = params.get('type');
      const rawPath = params.get('path');
      const managerParam = params.get('manager');
      const shariaParam = params.get('sharia');
      const riskParam = params.get('risk');
      const sortParam = params.get('sortBy');
      const dirParam = params.get('sortDir');
      const searchParam = params.get('search');
      const featuredParam = params.get('featured');

      if (searchParam) {
        this.searchText = searchParam;
        this.filter.search = searchParam;
      } else if (!this.searchText) {
        this.filter.search = undefined;
      }

      if (managerParam) {
        const mgrId = Number(managerParam);
        this.filter.assetManagerId = !isNaN(mgrId) && mgrId > 0 ? mgrId : undefined;
      } else {
        this.filter.assetManagerId = undefined;
      }

      if (shariaParam === 'compliant' || shariaParam === 'true') {
        this.filter.isIslamic = true;
      } else if (shariaParam === 'non-compliant' || shariaParam === 'false') {
        this.filter.isIslamic = false;
      } else {
        this.filter.isIslamic = undefined;
      }

      if (riskParam === 'low' || riskParam === 'medium' || riskParam === 'high') {
        this.filter.riskLevel = riskParam as 'low' | 'medium' | 'high';
      } else {
        this.filter.riskLevel = undefined;
      }

      if (featuredParam === 'true') {
        this.filter.isFeatured = true;
      } else {
        this.filter.isFeatured = undefined;
      }

      if (sortParam) {
        this.filter.sortBy = sortParam as never;
      }
      if (dirParam === 'asc' || dirParam === 'desc') {
        this.filter.sortDir = dirParam;
      }

      // Sync active quick chip
      if (this.filter.isIslamic === true) {
        this.activeChip = 'islamic';
      } else if (this.filter.isFeatured === true) {
        this.activeChip = 'featured';
      } else if (this.filter.sortBy === 'return1y' && (!this.filter.sortDir || this.filter.sortDir === 'desc') && !this.filter.isIslamic && !this.filter.isFeatured) {
        this.activeChip = 'top_return';
      } else {
        this.activeChip = 'all';
      }

      const targetSlug = (nodeSlug || leafSlug || subTypeSlug || typeSlug)?.trim().toLowerCase() || null;
      if (targetSlug) {
        this.pendingLegacySlug = targetSlug;
        if (this.classTree.length) {
          const full = this.pathForSlug(this.pendingLegacySlug);
          if (full.length) {
            this.classPath = full;
            this.staleNodeNotice = null;
          } else {
            this.classPath = [];
            this.staleNodeNotice = `التصنيف "${targetSlug}" لم يعد متاحاً وتم الرجوع للكل`;
          }
          this.pendingLegacySlug = null;
        } else {
          this.classPath = [targetSlug];
        }
        this.filter.node = this.classPath.length ? this.classPath[this.classPath.length - 1] : undefined;
        this.filter.type = undefined;
      } else if (rawPath) {
        this.classPath = rawPath.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        this.applyClassPathToFilter();
      } else {
        this.classPath = [];
        this.staleNodeNotice = null;
        this.applyClassPathToFilter();
      }

      this.loadFunds();
    });

    this.loadFundStats();
    this.loadClassTree();
    this.loadAssetManagers();
  }

  ngOnDestroy(): void {
    this.cache.saveScroll('funds-list', window.scrollX, window.scrollY);
    this.cache.saveUiState('funds-list', {
      filter: this.filter,
      classPath: this.classPath,
      searchText: this.searchText,
      activeChip: this.activeChip,
      advancedOpen: this.advancedOpen
    });
    this.querySub?.unsubscribe();
  }

  get sourceNote(): string | null {
    return 'المصدر: SNDUK';
  }

  /** Single legacy slug from ?node= / ?type= links, resolved to a full path once the tree loads. */
  private pendingLegacySlug: string | null = null;

  loadClassTree(): void {
    const cachedTree = this.cache.get<FundClassificationTreeNode[]>('funds_class_tree');
    if (cachedTree) {
      this.classTree = cachedTree.data;
      if (this.classPath.length) {
        const deepest = this.classPath[this.classPath.length - 1];
        const full = this.pathForSlug(deepest);
        if (full.length) {
          this.classPath = full;
          this.advancedOpen = true;
        }
      }
      if (!this.cache.isStale('funds_class_tree')) return;
    }

    this.api.getClassificationTree().subscribe({
      next: (tree) => {
        this.classTree = tree || [];
        this.cache.set('funds_class_tree', this.classTree);
        if (this.pendingLegacySlug) {
          const full = this.pathForSlug(this.pendingLegacySlug);
          if (full.length) {
            this.classPath = full;
            this.staleNodeNotice = null;
            this.applyClassPathToFilter();
            this.advancedOpen = true;
          } else {
            this.classPath = [];
            this.staleNodeNotice = `التصنيف "${this.pendingLegacySlug}" لم يعد متاحاً وتم الرجوع للكل`;
            this.updateUrlParams({ node: null });
          }
          this.pendingLegacySlug = null;
        } else if (this.classPath.length) {
          const deepest = this.classPath[this.classPath.length - 1];
          const full = this.pathForSlug(deepest);
          if (full.length) {
            this.classPath = full;
            this.advancedOpen = true;
          }
        }
      },
      error: () => {}
    });
  }

  loadAssetManagers(): void {
    const cachedManagers = this.cache.get<FundAssetManagerOption[]>('funds_asset_managers');
    if (cachedManagers) {
      this.assetManagers = cachedManagers.data;
      if (!this.cache.isStale('funds_asset_managers')) return;
    }

    this.api.getFundAssetManagers().subscribe({
      next: (managers) => {
        this.assetManagers = (managers || []).filter(m => m.fundCount > 0);
        this.cache.set('funds_asset_managers', this.assetManagers);
      },
      error: () => {}
    });
  }

  /** Full root-first path for any known slug (used for legacy single-slug links). */
  pathForSlug(slug: string): string[] {
    const s = (slug || '').trim().toLowerCase();
    if (!s) return [];
    // Legacy alias handled server-side too, but resolve locally for the cascade UI.
    const target = s === 'commodities' ? 'silver' : s;
    const bySlug = new Map(this.classTree.map(n => [n.slug.toLowerCase(), n]));
    const node = bySlug.get(target);
    if (!node) {
      return [];
    }
    const path: string[] = [node.slug];
    let cur: FundClassificationTreeNode | undefined = node;
    let guard = 0;
    while (cur?.parentSlug && guard++ < 8) {
      const parent = bySlug.get(cur.parentSlug.toLowerCase());
      if (!parent) break;
      path.unshift(parent.slug);
      cur = parent;
    }
    return path;
  }

  /** Deepest selected slug drives the API `node` filter (includes descendants server-side). */
  private applyClassPathToFilter(): void {
    const deepest = this.classPath.length ? this.classPath[this.classPath.length - 1] : undefined;
    this.filter.node = deepest;
    this.filter.type = undefined;
  }

  onClassPathChange(path: string[]): void {
    this.classPath = path;
    this.staleNodeNotice = null;
    this.applyClassPathToFilter();
    this.filter.page = 1;
    this.currentPage = 1;
    const deepest = this.classPath.length ? this.classPath[this.classPath.length - 1] : null;
    this.updateUrlParams({ node: deepest, path: null, type: null, subType: null, leaf: null });
  }

  onManagerChange(managerId: number | undefined): void {
    this.filter.assetManagerId = managerId ? Number(managerId) : undefined;
    this.filter.page = 1;
    this.currentPage = 1;
    this.updateUrlParams({ manager: this.filter.assetManagerId || null });
  }

  onShariaChange(val: boolean | undefined): void {
    this.filter.isIslamic = val;
    this.filter.page = 1;
    this.currentPage = 1;
    const shariaVal = val === true ? 'compliant' : val === false ? 'non-compliant' : null;
    this.updateUrlParams({ sharia: shariaVal });
  }

  onSortChange(): void {
    this.filter.page = 1;
    this.currentPage = 1;
    this.updateUrlParams({ sortBy: this.filter.sortBy, sortDir: this.filter.sortDir });
  }

  onRiskChange(val: string | undefined): void {
    this.filter.riskLevel = (val as 'low' | 'medium' | 'high') || undefined;
    this.filter.page = 1;
    this.currentPage = 1;
    this.updateUrlParams({ risk: this.filter.riskLevel || null });
  }

  updateUrlParams(params: Record<string, string | number | null | undefined>): void {
    navigateQueryParams(this.router, this.route, params, 'merge');
  }

  toggleAdvanced(): void {
    this.advancedOpen = !this.advancedOpen;
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.classPath.length > 0) count++;
    if (this.filter.assetManagerId) count++;
    if (this.filter.riskLevel) count++;
    if (this.filter.isIslamic !== undefined) count++;
    return count;
  }

  get activeNodeName(): string | null {
    if (!this.classPath.length || !this.classTree.length) return null;
    const deepestSlug = this.classPath[this.classPath.length - 1];
    const node = this.classTree.find(n => n.slug.toLowerCase() === deepestSlug.toLowerCase());
    return node ? node.nameAr : deepestSlug;
  }

  get activeManagerName(): string | null {
    if (!this.filter.assetManagerId || !this.assetManagers.length) return null;
    const mgr = this.assetManagers.find(m => m.id === this.filter.assetManagerId);
    return mgr ? mgr.nameAr : null;
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.searchText ||
      this.classPath.length > 0 ||
      this.filter.assetManagerId ||
      this.filter.riskLevel ||
      this.filter.isIslamic !== undefined ||
      this.filter.isFeatured
    );
  }

  removeSearchFilter(): void {
    this.searchText = '';
    this.filter.search = undefined;
    this.updateUrlParams({ search: null });
    this.loadFunds();
  }

  removeNodeFilter(): void {
    this.classPath = [];
    this.staleNodeNotice = null;
    this.filter.node = undefined;
    this.updateUrlParams({ node: null });
  }

  removeManagerFilter(): void {
    this.filter.assetManagerId = undefined;
    this.updateUrlParams({ manager: null });
  }

  removeRiskFilter(): void {
    this.filter.riskLevel = undefined;
    this.updateUrlParams({ risk: null });
  }

  removeShariaFilter(): void {
    this.filter.isIslamic = undefined;
    this.updateUrlParams({ sharia: null });
  }

  loadFunds(): void {
    this.filter.page = this.currentPage;
    const cacheKey = 'funds_query_' + JSON.stringify(this.filter);
    const cached = this.cache.get<FundPagedResultDto>(cacheKey);
    if (cached) {
      this.funds = cached.data.items;
      this.totalCount = cached.data.totalCount;
      this.totalPages = cached.data.totalPages;
      this.currentPage = cached.data.page;
      this.loading = false;
      this.initialLoading = false;
      this.hasInitialized = true;
      this.loadError = false;
      this.updateLastSyncedAt();
      this.rebuild();
      this.cache.restoreScroll('funds-list');
      if (!this.cache.isStale(cacheKey)) {
        return;
      }
      this.fundsQuery$.next({ ...this.filter, _silent: true });
      return;
    }
    this.fundsQuery$.next({ ...this.filter });
  }

  loadFundStats(): void {
    const cached = this.cache.get<KpiData[]>('funds_stats');
    if (cached) {
      this.kpiList = cached.data;
      this.statsLoading = false;
      this.rebuild();
      if (!this.cache.isStale('funds_stats')) {
        return;
      }
    } else {
      this.statsLoading = true;
      this.rebuild();
    }

    this.api.getFundStats().subscribe({
      next: (stats) => {
        this.kpiList = [
          { icon: this.Building2Icon, value: String(stats.totalCount), label: 'صندوقاً استثمارياً' },
          {
            icon: this.TrendingUpIcon,
            value: stats.bestDailyChange != null
              ? `${stats.bestDailyChange > 0 ? '+' : ''}${stats.bestDailyChange.toFixed(2)}%`
              : '—',
            sub: stats.bestDailyChangeCode ?? null,
            label: 'أفضل أداء اليوم'
          },
          { icon: this.ShieldCheckIcon, value: String(stats.islamicCount), label: 'متوافق شرعياً (SNDUK)' },
          { icon: this.DollarSignIcon, value: this.formatAum(stats.totalAum), label: 'إجمالي الأصول تحت الإدارة' }
        ];
        this.cache.set('funds_stats', this.kpiList);
        this.statsLoading = false;
        this.rebuild();
      },
      error: () => {
        this.statsLoading = false;
        this.rebuild();
      }
    });
  }

  private formatAum(value: number): string {
    if (!value) return '—';
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)} مليار`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)} م`;
    return String(Math.round(value));
  }

  updateLastSyncedAt(): void {
    const latest = this.funds.reduce((max, f) => f.lastSyncedAt && f.lastSyncedAt > max ? f.lastSyncedAt : max, '');
    this.lastSyncedAt = latest || null;
  }

  setChip(id: string): void {
    this.activeChip = id;
    this.filter.page = 1;
    this.currentPage = 1;
    const chip = this.quickChips.find(c => c.id === id);
    if (!chip || id === 'all') {
      this.filter.isIslamic = undefined;
      this.filter.isFeatured = undefined;
      this.updateUrlParams({ sharia: null, featured: null });
    } else if (id === 'islamic') {
      this.filter.isIslamic = true;
      this.filter.isFeatured = undefined;
      this.updateUrlParams({ sharia: 'compliant', featured: null });
    } else if (id === 'featured') {
      this.filter.isIslamic = undefined;
      this.filter.isFeatured = true;
      this.updateUrlParams({ sharia: null, featured: 'true' });
    } else if (id === 'top_return') {
      this.filter.sortBy = 'return1y';
      this.filter.sortDir = 'desc';
      this.filter.isIslamic = undefined;
      this.filter.isFeatured = undefined;
      this.updateUrlParams({ sortBy: 'return1y', sortDir: 'desc', sharia: null, featured: null });
    }
    this.loadFunds();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadFunds();
  }

  resetFilters(): void {
    this.filter = { sortBy: 'return1y', sortDir: 'desc', page: 1, pageSize: 20 };
    this.classPath = [];
    this.searchText = '';
    this.activeChip = 'all';
    this.staleNodeNotice = null;
    this.currentPage = 1;
    this.updateUrlParams({
      node: null,
      path: null,
      type: null,
      subType: null,
      leaf: null,
      manager: null,
      sharia: null,
      risk: null,
      featured: null,
      search: null,
      sortBy: null,
      sortDir: null
    });
    this.loadFunds();
  }

  trackFund(_: number, fund: FundListItemDto): string { return fund.code; }

  cardStats(fund: FundListItemDto): EntityStat[] {
    const stats: EntityStat[] = [
      fund.currentPrice != null
        ? { label: 'السعر', value: fund.currentPrice + ' ' + (fund.currency || 'EGP') }
        : { label: 'السعر', value: null },
      fund.dailyChange != null
        ? { label: 'التغيير اليومي', value: (fund.dailyChange > 0 ? '+' : '') + fund.dailyChange + '%', tone: fund.dailyChange > 0 ? 'positive' : fund.dailyChange < 0 ? 'negative' : 'muted' }
        : { label: 'التغيير اليومي', value: null },
      fund.return1M != null
        ? { label: 'العائد 1M', value: (fund.return1M > 0 ? '+' : '') + fund.return1M.toFixed(2) + '%', tone: fund.return1M > 0 ? 'positive' : fund.return1M < 0 ? 'negative' : 'muted' }
        : { label: 'العائد 1M', value: null },
      fund.aum != null
        ? { label: 'الأصول (AUM)', value: (fund.aum / 1e6).toFixed(1) + ' م ' + (fund.currency || 'EGP') }
        : { label: 'الأصول (AUM)', value: null },
      fund.managementFee != null
        ? { label: 'الرسوم السنوية', value: fund.managementFee + '%' }
        : { label: 'الرسوم السنوية', value: null }
    ];
    const riskLabel = fundRiskLabelAr(normFundRiskLevel(fund.riskLevel));
    if (riskLabel !== null) {
      stats.push({ label: 'المخاطر', value: riskLabel });
    }
    return stats;
  }

  getClassificationBadge(fund: FundListItemDto): string {
    if (fund.effectiveClassification?.leafNameAr) {
      return fund.effectiveClassification.leafNameAr;
    }
    if (fund.effectiveClassification?.nameAr) {
      return fund.effectiveClassification.nameAr;
    }
    if (fund.effectiveClassification?.rootNameAr) {
      return fund.effectiveClassification.rootNameAr;
    }
    if (fund.classificationPathAr) {
      const parts = fund.classificationPathAr.split(' › ');
      if (parts.length > 0 && parts[parts.length - 1].trim()) return parts[parts.length - 1].trim();
    }
    return fund.typeNameAr || 'غير مصنف';
  }



  getFundIcon(type: FundType): any {
    switch (type) {
      case 'equity': return this.Building2Icon;
      case 'fixed_income': return this.DollarSignIcon;
      case 'money_market': return this.ShieldCheckIcon;
      case 'balanced': return this.TrendingUpIcon;
      case 'index': return this.StarIcon;
      case 'gold': return this.DollarSignIcon;
      default: return this.Building2Icon;
    }
  }

  getFundAccent(type: FundType): { accent: string; tint: string; ink: string } {
    switch (type) {
      case 'equity': return { accent: '#2563eb', tint: '#dbeafe', ink: '#1e40af' };
      case 'fixed_income': return { accent: '#16a34a', tint: '#dcfce7', ink: '#166534' };
      case 'money_market': return { accent: '#0891b2', tint: '#cffafe', ink: '#0e7490' };
      case 'balanced': return { accent: '#9333ea', tint: '#f3e8ff', ink: '#6b21a8' };
      case 'index': return { accent: '#f59e0b', tint: '#fef3c7', ink: '#92400e' };
      case 'gold': return { accent: '#f59e0b', tint: '#fef3c7', ink: '#92400e' };
      default: return { accent: '#64748b', tint: '#f1f5f9', ink: '#475569' };
    }
  }

  config: MzListingConfig = { header: { badge: '', title: '', description: '' }, cards: [], empty: { title: '', message: '' } };

  onSearchInput(val: string): void {
    this.searchText = val;
    this.searchChanged.next(val);
  }

  onSortChangeSelect(val: string): void {
    const [field, dir] = val.split(':');
    this.filter.sortBy = field as any;
    this.filter.sortDir = dir as any;
    this.onSortChange();
  }

  rebuild(): void {
    const busy = this.initialLoading || (this.loading && !this.initialLoading);
    this.config = {
      header: {
        badge: 'الصناديق الاستثمارية',
        count: this.totalCount + ' صندوقاً استثمارياً',
        title: 'الصناديق الاستثمارية المصرية',
        description: 'استعرض وحلل جميع الصناديق الاستثمارية في السوق المصري، مستويات المخاطر، العوائد والرسوم، والرقابة الشرعية.'
      },
      stats: this.kpiList.map((k) => ({ label: k.label, value: k.value, icon: k.icon, chip: k.sub })),
      statsLoading: this.statsLoading,
      statsCount: 4,
      tabs: this.quickChips.map((c) => ({ id: c.id, label: c.label })),
      activeTab: this.activeChip,
      filters: {
        searchValue: this.searchText,
        searchPlaceholder: 'ابحث بالاسم أو الرمز (مثال: PHF)...',
        controls: [],
        sort: {
          label: 'ترتيب الصناديق',
          value: (this.filter.sortBy || 'return1y') + ':' + (this.filter.sortDir || 'desc'),
          options: [
            { value: 'return1y:desc', label: 'العائد السنوي (1Y) (تنازلي)' },
            { value: 'return1y:asc', label: 'العائد السنوي (1Y) (تصاعدي)' },
            { value: 'return6m:desc', label: 'العائد (6M) (تنازلي)' },
            { value: 'return3m:desc', label: 'العائد (3M) (تنازلي)' },
            { value: 'return1m:desc', label: 'العائد (1M) (تنازلي)' },
            { value: 'aum:desc', label: 'الأصول (AUM) (الأعلى)' },
            { value: 'totalScore:desc', label: 'الدرجة الكلية (الأعلى)' },
            { value: 'managementFee:asc', label: 'الرسوم السنوية (الأقل)' },
            { value: 'name:asc', label: 'الاسم أبجدياً' }
          ]
        },
        advanced: {
          label: 'فلاتر متقدمة',
          open: this.advancedOpen,
          count: this.activeFiltersCount
        }
      },
      results: {
        text: this.totalCount + ' نتيجة مطابقة (الصفحة ' + this.currentPage + ' من ' + (this.totalPages || 1) + ')',
        note: this.sourceNote
      },
      cards: this.funds.map((f) => this.toCard(f)),
      skeletonCount: this.filter.pageSize || 20,
      cardType: 'fund',
      loading: busy,
      error: !this.initialLoading && this.loadError ? { title: 'تعذّر تحميل الصناديق', message: 'تحقق من الاتصال ثم حاول مرة أخرى.' } : null,
      empty: { title: 'لا توجد صناديق مطابقة للفلاتر المختارة', message: 'جرّب تعديل خيارات البحث أو إزالة أحد الفلاتر لتوسيع نطاق النتائج.' },
      page: this.currentPage,
      totalPages: this.totalPages
    };
  }

  private toCard(fund: FundListItemDto): MzListingCardData {
    const rawType = normFundType(fund.type);
    const badges: { label: string; tone?: any }[] = [];
    if (fund.isIslamic) {
      badges.push({ label: 'متوافق شرعاً', tone: 'default' });
    }
    const catBadge = this.getClassificationBadge(fund);
    if (catBadge) {
      badges.push({ label: catBadge, tone: 'neutral' });
    }
    return {
      id: fund.code,
      title: fund.displayName || fund.nameAr,
      subtitle: '',
      icon: this.getFundIcon(rawType),
      logoUrl: fundLogoUrl(fund.localLogoPath, fund.logoUrl),
      featured: fund.isFeatured,
      badges,
      metrics: this.cardStats(fund).map((st) => ({ label: st.label, value: st.value, tone: st.tone })),
      linkLabel: 'استعراض الصندوق',
      link: ['/funds', fund.slug]
    };
  }

}
