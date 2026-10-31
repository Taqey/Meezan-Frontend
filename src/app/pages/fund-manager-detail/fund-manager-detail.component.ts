import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { navigateQueryParams } from '../../utils/navigation-utils';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, ChevronDown, ShieldCheck, TrendingUp, Star, Building2, DollarSign, SlidersHorizontal, RotateCcw, X } from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { SessionCacheService } from '../../services/session-cache.service';
import {
  FundListItemDto,
  FundPagedResultDto,
  FundListFilter,
  FundType,
  FundClassificationTreeNode,
  FundAssetManagerOption
} from '../../models/api.models';
import {
  normFundType,
  normFundRiskLevel,
  fundRiskLabelAr,
  fundLogoUrl,
  FUND_SHARIA_BADGE_TOOLTIP,
  normalizeManagerKey,
  normalizeManagerSlug
} from '../../models/fund-display';
import { MzListingPageComponent, type MzListingConfig } from '../../components/ui/ui-listing-page';
import { MzSelectComponent, type MzOption } from '../../components/ui/ui-small';
import type { MzListingCardData } from '../../components/ui/ui-listing';
import { ClassificationCascadeComponent } from '../../components/classification-cascade/classification-cascade.component';
import { type EntityStat } from '../../components/entity-card/entity-card.component';
import { debounceTime, distinctUntilChanged, forkJoin, Subject, takeUntil } from 'rxjs';
import { KpiData } from '../../components/kpi-strip/kpi-strip.component';

@Component({
  selector: 'app-fund-manager-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ClassificationCascadeComponent,
    MzListingPageComponent,
    MzSelectComponent
  ],
  template: `
    <mz-listing-page
      [config]="config"
      (tabChange)="setChip($event)"
      (searchChange)="onSearchInput($event)"
      (sortChange)="onSortChangeSelect($event)"
      (advancedClick)="toggleAdvanced(); rebuild()"
      (pageChange)="goToPage($event)"
      (retry)="loadData()">

      <div resultsExtra class="mz-active-filters" *ngIf="hasActiveFilters">
        <span class="mz-badge pill neutral" *ngIf="searchText">البحث: {{ searchText }} <button type="button" class="mz-x" (click)="removeSearchFilter()" aria-label="حذف بحث">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="activeNodeName">التصنيف: {{ activeNodeName }} <button type="button" class="mz-x" (click)="removeNodeFilter()" aria-label="حذف فلتر التصنيف">×</button></span>
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
        <div class="mz-slicer">
          <span class="mz-slicer-head"><span>النتائج لكل صفحة</span></span>
          <mz-select
            [options]="pageSizeOptions"
            [value]="filter.pageSize ?? 20"
            (valueChange)="onPageSizeChange($event)"
            ariaLabel="النتائج لكل صفحة">
          </mz-select>
        </div>
      </div>

      <div footer class="mz-source-note" style="margin-top:24px">
        المصدر: <a href="https://snduk.com" target="_blank" rel="noopener noreferrer" style="color:var(--mz-primary);text-decoration:underline">SNDUK</a> |
        آخر تحديث: {{ lastSyncedAt ? (lastSyncedAt | date:'yyyy-MM-dd HH:mm') : '—' }} |
        <span>إخلاء المسؤولية: البيانات للأغراض المعلوماتية فقط ولا تُعد نصيحة استثمارية.</span>
      </div>
    </mz-listing-page>
  `
})
export class FundManagerDetailComponent implements OnInit, OnDestroy {
  readonly Building2Icon = Building2;
  readonly TrendingUpIcon = TrendingUp;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly DollarSignIcon = DollarSign;
  readonly StarIcon = Star;

  private destroy$ = new Subject<void>();

  managerParam = '';
  manager: FundAssetManagerOption | null = null;
  managerNotFound = false;

  allManagerFunds: FundListItemDto[] = [];
  filteredFunds: FundListItemDto[] = [];
  pagedFunds: FundListItemDto[] = [];

  classTree: FundClassificationTreeNode[] = [];
  classPath: string[] = [];

  loading = true;
  statsLoading = true;
  loadError = false;

  filter: FundListFilter = {
    sortBy: 'return1y',
    sortDir: 'desc',
    page: 1,
    pageSize: 20
  };

  searchText = '';
  readonly searchChanged = new Subject<string>();

  currentPage = 1;
  totalPages = 1;
  totalFilteredCount = 0;

  activeChip = 'all';
  advancedOpen = false;

  readonly quickChips = [
    { id: 'all', label: 'الكل' },
    { id: 'islamic', label: 'متوافق شرعياً' },
    { id: 'featured', label: 'مميز' },
    { id: 'top_return', label: 'أعلى عائد' }
  ];

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

  readonly pageSizeOptions: MzOption[] = [
    { value: 10, label: '10 صناديق' },
    { value: 20, label: '20 صندوقاً' },
    { value: 50, label: '50 صندوقاً' }
  ];

  kpiStats: Array<{ label: string; value: string; icon: any; chip?: string | null }> = [];
  lastSyncedAt: string | null = null;

  config: MzListingConfig = {
    backLink: { label: 'العودة إلى الصناديق', to: '/funds' },
    header: { badge: 'شركة إدارة صناديق', title: '', description: '' },
    cards: [],
    empty: { title: '', message: '' }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cache: SessionCacheService
  ) {}

  ngOnInit(): void {
    this.searchChanged.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((query) => {
      this.searchText = query?.trim() || '';
      this.filter.page = 1;
      this.currentPage = 1;
      this.applyFiltersAndPaginate();
      this.updateUrlParams({ search: this.searchText || null, page: null });
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== this.managerParam) {
        this.managerParam = id;
        this.restoreStateOrLoad();
      }
    });

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const pageParam = params.get('page');
      const pageSizeParam = params.get('pageSize');
      const searchParam = params.get('search');
      const shariaParam = params.get('sharia');
      const riskParam = params.get('risk');
      const featuredParam = params.get('featured');
      const sortParam = params.get('sortBy');
      const dirParam = params.get('sortDir');
      const nodeParam = params.get('node');

      if (pageParam) this.currentPage = Math.max(1, Number(pageParam) || 1);
      if (pageSizeParam) this.filter.pageSize = Number(pageSizeParam) || 20;
      if (searchParam) this.searchText = searchParam;
      if (shariaParam === 'compliant' || shariaParam === 'true') this.filter.isIslamic = true;
      else if (shariaParam === 'non-compliant' || shariaParam === 'false') this.filter.isIslamic = false;
      else this.filter.isIslamic = undefined;

      if (riskParam === 'low' || riskParam === 'medium' || riskParam === 'high') {
        this.filter.riskLevel = riskParam as any;
      } else {
        this.filter.riskLevel = undefined;
      }

      if (featuredParam === 'true') this.filter.isFeatured = true;
      else this.filter.isFeatured = undefined;

      if (sortParam) this.filter.sortBy = sortParam as any;
      if (dirParam === 'asc' || dirParam === 'desc') this.filter.sortDir = dirParam;

      if (nodeParam) {
        this.classPath = [nodeParam];
      } else {
        this.classPath = [];
      }

      // Sync active chip
      if (this.filter.isIslamic === true) this.activeChip = 'islamic';
      else if (this.filter.isFeatured === true) this.activeChip = 'featured';
      else if (this.filter.sortBy === 'return1y' && (!this.filter.sortDir || this.filter.sortDir === 'desc')) this.activeChip = 'top_return';
      else this.activeChip = 'all';

      if (this.allManagerFunds.length > 0) {
        this.applyFiltersAndPaginate();
      }
    });
  }

  ngOnDestroy(): void {
    this.cache.saveScroll(`fund_manager_${this.managerParam}`, window.scrollX, window.scrollY);
    this.cache.saveUiState(`fund_manager_${this.managerParam}`, {
      filter: this.filter,
      classPath: this.classPath,
      searchText: this.searchText,
      activeChip: this.activeChip,
      advancedOpen: this.advancedOpen
    });
    this.destroy$.next();
    this.destroy$.complete();
  }

  private restoreStateOrLoad(): void {
    const saved = this.cache.getUiState<any>(`fund_manager_${this.managerParam}`);
    if (saved && !this.route.snapshot.queryParamMap.keys.length) {
      this.filter = saved.filter || this.filter;
      this.classPath = saved.classPath || [];
      this.searchText = saved.searchText || '';
      this.activeChip = saved.activeChip || 'all';
      this.advancedOpen = saved.advancedOpen || false;
      this.currentPage = this.filter.page || 1;
    }
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.statsLoading = true;
    this.loadError = false;
    this.managerNotFound = false;
    this.rebuild();

    const cacheKeyAll = `fund_manager_all_${this.managerParam}`;
    const cached = this.cache.get<{ manager: FundAssetManagerOption; funds: FundListItemDto[] }>(cacheKeyAll);

    if (cached) {
      this.manager = cached.data.manager;
      this.allManagerFunds = cached.data.funds;
      this.computeManagerKpis(this.allManagerFunds);
      this.statsLoading = false;
      this.loading = false;
      this.applyFiltersAndPaginate();
      this.loadClassTree();
      this.cache.restoreScroll(`fund_manager_${this.managerParam}`);
      if (!this.cache.isStale(cacheKeyAll)) return;
    }

    // Fetch managers list and the full funds catalog (2 pages of 100 covers 172 funds)
    forkJoin([
      this.api.getFundAssetManagers(),
      this.api.getFunds({ page: 1, pageSize: 100 }),
      this.api.getFunds({ page: 2, pageSize: 100 })
    ]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([managers, p1, p2]) => {
        const allFunds = [...(p1.items || []), ...(p2.items || [])];
        const param = this.managerParam.trim().toLowerCase();
        const paramNum = Number(param);

        // Match manager either by numeric id OR by normalized Arabic name slug
        let foundMgr = managers?.find(m => (!isNaN(paramNum) && m.id === paramNum) || normalizeManagerSlug(m.nameAr) === param || normalizeManagerKey(m.nameAr) === normalizeManagerKey(param));

        // Filter all funds belonging to this manager
        let mgrFunds: FundListItemDto[] = [];
        if (foundMgr) {
          mgrFunds = allFunds.filter(f => f.assetManagerId === foundMgr!.id || normalizeManagerKey(f.assetManagerName) === normalizeManagerKey(foundMgr!.nameAr));
        } else {
          // Check if any fund in catalog has matching assetManagerId or slug
          mgrFunds = allFunds.filter(f => (!isNaN(paramNum) && f.assetManagerId === paramNum) || normalizeManagerSlug(f.assetManagerName) === param || normalizeManagerKey(f.assetManagerName) === normalizeManagerKey(param));
          if (mgrFunds.length > 0) {
            const first = mgrFunds[0];
            foundMgr = {
              id: first.assetManagerId || (!isNaN(paramNum) ? paramNum : 0),
              nameAr: first.assetManagerName || param,
              nameEn: first.assetManagerNameEn || param,
              fundCount: mgrFunds.length
            };
          }
        }

        if (!foundMgr || mgrFunds.length === 0) {
          this.manager = null;
          this.managerNotFound = true;
          this.loading = false;
          this.statsLoading = false;
          this.rebuild();
          return;
        }

        this.manager = foundMgr;
        this.allManagerFunds = mgrFunds;
        this.cache.set(cacheKeyAll, { manager: foundMgr, funds: mgrFunds });
        this.computeManagerKpis(mgrFunds);
        this.statsLoading = false;
        this.loading = false;
        this.applyFiltersAndPaginate();
        this.loadClassTree();
      },
      error: () => {
        if (!cached) {
          this.loading = false;
          this.statsLoading = false;
          this.loadError = true;
          this.rebuild();
        }
      }
    });
  }

  loadClassTree(): void {
    const cachedTree = this.cache.get<FundClassificationTreeNode[]>('funds_class_tree');
    if (cachedTree) {
      this.classTree = cachedTree.data;
      return;
    }
    this.api.getClassificationTree().pipe(takeUntil(this.destroy$)).subscribe({
      next: (tree) => {
        this.classTree = tree || [];
        this.cache.set('funds_class_tree', this.classTree);
      },
      error: () => {}
    });
  }

  private computeManagerKpis(allFunds: FundListItemDto[]): void {
    // 1. Number of funds
    const totalFunds = allFunds.length;

    // 2. Total AUM
    const sumAum = allFunds.reduce((acc, f) => acc + (f.aum || 0), 0);
    const aumDisplay = sumAum > 0
      ? (sumAum >= 1e9 ? `${(sumAum / 1e9).toFixed(2)} مليار ج.م` : `${(sumAum / 1e6).toFixed(1)} مليون ج.م`)
      : '—';

    // 3. Sharia compliant count
    const islamicCount = allFunds.filter(f => !!f.isIslamic).length;

    // 4. Best performer today (highest dailyChange)
    const fundsWithDaily = allFunds.filter(f => f.dailyChange != null);
    fundsWithDaily.sort((a, b) => (b.dailyChange ?? -Infinity) - (a.dailyChange ?? -Infinity));
    const bestFund = fundsWithDaily.length > 0 ? fundsWithDaily[0] : null;

    let bestChangeStr = '—';
    let bestCode: string | null = null;
    if (bestFund && bestFund.dailyChange != null) {
      bestChangeStr = `${bestFund.dailyChange > 0 ? '+' : ''}${bestFund.dailyChange.toFixed(2)}%`;
      bestCode = bestFund.code;
    }

    this.kpiStats = [
      {
        label: 'إجمالي صناديق الشركة',
        value: String(totalFunds),
        icon: this.Building2Icon
      },
      {
        label: 'إجمالي الأصول تحت الإدارة',
        value: aumDisplay,
        icon: this.DollarSignIcon
      },
      {
        label: 'متوافق شرعياً (SNDUK)',
        value: `${islamicCount} من ${totalFunds}`,
        icon: this.ShieldCheckIcon
      },
      {
        label: 'أفضل أداء اليوم',
        value: bestChangeStr,
        chip: bestCode,
        icon: this.TrendingUpIcon
      }
    ];

    const latest = allFunds.reduce((max, f) => f.lastSyncedAt && f.lastSyncedAt > max ? f.lastSyncedAt : max, '');
    this.lastSyncedAt = latest || null;
  }

  private applyFiltersAndPaginate(): void {
    let list = [...this.allManagerFunds];

    // Search filter
    if (this.searchText) {
      const q = this.searchText.trim().toLowerCase();
      list = list.filter(f =>
        f.code.toLowerCase().includes(q) ||
        (f.nameAr && f.nameAr.toLowerCase().includes(q)) ||
        (f.displayName && f.displayName.toLowerCase().includes(q)) ||
        (f.nameEn && f.nameEn.toLowerCase().includes(q))
      );
    }

    // Sharia compliance filter
    if (this.filter.isIslamic !== undefined) {
      list = list.filter(f => !!f.isIslamic === this.filter.isIslamic);
    }

    // Featured filter
    if (this.filter.isFeatured) {
      list = list.filter(f => !!f.isFeatured);
    }

    // Risk level filter
    if (this.filter.riskLevel) {
      list = list.filter(f => normFundRiskLevel(f.riskLevel) === this.filter.riskLevel);
    }

    // Classification node filter
    if (this.classPath.length > 0) {
      const targetSlug = this.classPath[this.classPath.length - 1].toLowerCase();
      list = list.filter(f => {
        const eff = f.effectiveClassification;
        const slugs = eff?.pathSlugs || (f.typeSlug ? [f.typeSlug] : []);
        return slugs.some(s => s.toLowerCase() === targetSlug) ||
               (eff?.leafSlug && eff.leafSlug.toLowerCase() === targetSlug) ||
               (eff?.rootSlug && eff.rootSlug.toLowerCase() === targetSlug) ||
               (f.classificationSlug && f.classificationSlug.toLowerCase() === targetSlug);
      });
    }

    // Sorting
    const sortField = this.filter.sortBy || 'return1y';
    const sortDir = this.filter.sortDir || 'desc';
    const mult = sortDir === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      let valA: any = null;
      let valB: any = null;
      switch (sortField) {
        case 'return1y': valA = a.return1Y; valB = b.return1Y; break;
        case 'return6m': valA = a.return6M; valB = b.return6M; break;
        case 'return3m': valA = a.return3M; valB = b.return3M; break;
        case 'return1m': valA = a.return1M; valB = b.return1M; break;
        case 'aum': valA = a.aum; valB = b.aum; break;
        case 'totalScore': valA = a.totalScore; valB = b.totalScore; break;
        case 'managementFee': valA = a.managementFee; valB = b.managementFee; break;
        case 'name': valA = a.nameAr; valB = b.nameAr; break;
        default: valA = a.return1Y; valB = b.return1Y;
      }
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'string') return mult * valA.localeCompare(String(valB), 'ar');
      return mult * (valA - valB);
    });

    this.filteredFunds = list;
    this.totalFilteredCount = list.length;
    const pageSize = this.filter.pageSize || 20;
    this.totalPages = Math.max(1, Math.ceil(this.totalFilteredCount / pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

    const start = (this.currentPage - 1) * pageSize;
    this.pagedFunds = list.slice(start, start + pageSize);
    this.rebuild();
  }

  setChip(id: string): void {
    this.activeChip = id;
    this.currentPage = 1;
    this.filter.page = 1;
    if (id === 'all') {
      this.filter.isIslamic = undefined;
      this.filter.isFeatured = undefined;
      this.updateUrlParams({ sharia: null, featured: null, page: null });
    } else if (id === 'islamic') {
      this.filter.isIslamic = true;
      this.filter.isFeatured = undefined;
      this.updateUrlParams({ sharia: 'compliant', featured: null, page: null });
    } else if (id === 'featured') {
      this.filter.isIslamic = undefined;
      this.filter.isFeatured = true;
      this.updateUrlParams({ sharia: null, featured: 'true', page: null });
    } else if (id === 'top_return') {
      this.filter.sortBy = 'return1y';
      this.filter.sortDir = 'desc';
      this.filter.isIslamic = undefined;
      this.filter.isFeatured = undefined;
      this.updateUrlParams({ sortBy: 'return1y', sortDir: 'desc', sharia: null, featured: null, page: null });
    }
    this.applyFiltersAndPaginate();
  }

  onSearchInput(val: string): void {
    this.searchText = val;
    this.searchChanged.next(val);
  }

  onSortChangeSelect(val: string): void {
    const [field, dir] = val.split(':');
    this.filter.sortBy = field as any;
    this.filter.sortDir = dir as any;
    this.currentPage = 1;
    this.filter.page = 1;
    this.updateUrlParams({ sortBy: field, sortDir: dir, page: null });
    this.applyFiltersAndPaginate();
  }

  onClassPathChange(path: string[]): void {
    this.classPath = path;
    this.currentPage = 1;
    this.filter.page = 1;
    const deepest = path.length ? path[path.length - 1] : null;
    this.updateUrlParams({ node: deepest, page: null });
    this.applyFiltersAndPaginate();
  }

  onRiskChange(val: string | undefined): void {
    this.filter.riskLevel = (val as any) || undefined;
    this.currentPage = 1;
    this.filter.page = 1;
    this.updateUrlParams({ risk: this.filter.riskLevel || null, page: null });
    this.applyFiltersAndPaginate();
  }

  onShariaChange(val: boolean | undefined): void {
    this.filter.isIslamic = val;
    this.currentPage = 1;
    this.filter.page = 1;
    const shariaVal = val === true ? 'compliant' : val === false ? 'non-compliant' : null;
    this.updateUrlParams({ sharia: shariaVal, page: null });
    this.applyFiltersAndPaginate();
  }

  onPageSizeChange(val: number): void {
    this.filter.pageSize = val || 20;
    this.currentPage = 1;
    this.filter.page = 1;
    this.updateUrlParams({ pageSize: val !== 20 ? val : null, page: null });
    this.applyFiltersAndPaginate();
  }

  toggleAdvanced(): void {
    this.advancedOpen = !this.advancedOpen;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.filter.page = page;
    this.updateUrlParams({ page: page > 1 ? page : null });
    this.applyFiltersAndPaginate();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  removeSearchFilter(): void {
    this.searchText = '';
    this.updateUrlParams({ search: null, page: null });
    this.applyFiltersAndPaginate();
  }

  removeNodeFilter(): void {
    this.classPath = [];
    this.updateUrlParams({ node: null, page: null });
    this.applyFiltersAndPaginate();
  }

  removeRiskFilter(): void {
    this.filter.riskLevel = undefined;
    this.updateUrlParams({ risk: null, page: null });
    this.applyFiltersAndPaginate();
  }

  removeShariaFilter(): void {
    this.filter.isIslamic = undefined;
    this.updateUrlParams({ sharia: null, page: null });
    this.applyFiltersAndPaginate();
  }

  resetFilters(): void {
    this.searchText = '';
    this.classPath = [];
    this.filter.riskLevel = undefined;
    this.filter.isIslamic = undefined;
    this.filter.isFeatured = undefined;
    this.filter.sortBy = 'return1y';
    this.filter.sortDir = 'desc';
    this.activeChip = 'all';
    this.currentPage = 1;
    this.filter.page = 1;
    this.updateUrlParams({
      search: null,
      node: null,
      risk: null,
      sharia: null,
      featured: null,
      sortBy: null,
      sortDir: null,
      page: null
    });
    this.applyFiltersAndPaginate();
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.searchText ||
      this.classPath.length > 0 ||
      this.filter.riskLevel ||
      this.filter.isIslamic !== undefined ||
      this.filter.isFeatured
    );
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.classPath.length > 0) count++;
    if (this.filter.riskLevel) count++;
    if (this.filter.isIslamic !== undefined) count++;
    return count;
  }

  get activeNodeName(): string | null {
    if (!this.classPath.length || !this.classTree.length) return null;
    const deepest = this.classPath[this.classPath.length - 1];
    const node = this.classTree.find(n => n.slug.toLowerCase() === deepest.toLowerCase());
    return node ? node.nameAr : deepest;
  }

  updateUrlParams(params: Record<string, string | number | null | undefined>): void {
    navigateQueryParams(this.router, this.route, params, 'merge');
  }

  rebuild(): void {
    if (this.managerNotFound) {
      this.config = {
        backLink: { label: 'العودة إلى الصناديق', to: '/funds' },
        header: {
          badge: 'شركة إدارة صناديق',
          title: 'لم يتم العثور على شركة إدارة الصناديق',
          description: 'الرابط المطلوب غير موجود أو لا توجد صناديق استثمارية مرتبطة بهذا المعرّف.'
        },
        cards: [],
        empty: {
          title: 'لم يتم العثور على شركة الإدارة المطلوبة',
          message: 'تأكد من صحة الرابط أو عُد إلى قائمة الصناديق لاستعراض الشركات المتاحة.'
        }
      };
      return;
    }

    const title = this.manager?.nameAr || 'شركة إدارة صناديق استثمارية';
    const desc = this.manager?.nameEn || 'استعرض جميع الصناديق الاستثمارية المدارة من قِبل الشركة وأداءها التاريخي.';
    const countStr = `${this.allManagerFunds.length} صندوقاً استثمارياً`;

    this.config = {
      backLink: { label: 'العودة إلى الصناديق', to: '/funds' },
      header: {
        badge: 'شركة إدارة صناديق',
        count: countStr,
        title,
        description: desc
      },
      stats: this.kpiStats,
      statsLoading: this.statsLoading,
      statsCount: 4,
      tabs: this.quickChips,
      activeTab: this.activeChip,
      filters: {
        searchValue: this.searchText,
        searchPlaceholder: `ابحث في صناديق ${title}...`,
        controls: [],
        sort: {
          label: 'ترتيب الصناديق',
          value: `${this.filter.sortBy || 'return1y'}:${this.filter.sortDir || 'desc'}`,
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
        text: `${this.totalFilteredCount} نتيجة مطابقة (الصفحة ${this.currentPage} من ${this.totalPages || 1})`,
        note: `صناديق مدارة بواسطة ${title}`
      },
      cards: this.pagedFunds.map(f => this.toCard(f)),
      skeletonCount: this.filter.pageSize || 20,
      cardType: 'fund',
      loading: this.loading,
      error: this.loadError ? { title: 'تعذّر تحميل بيانات الشركة', message: 'تحقق من الاتصال بالإنترنت ثم حاول مرة أخرى.' } : null,
      empty: {
        title: 'لا توجد صناديق مطابقة للفلاتر المختارة',
        message: 'جرّب تعديل خيارات البحث أو مسح الفلاتر لعرض كافة صناديق هذه الشركة.'
      },
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
      isFundCard: true,
      favoriteSymbol: 'FUND:' + fund.code,
      icon: this.getFundIcon(rawType),
      logoUrl: fundLogoUrl(fund.localLogoPath, fund.logoUrl),
      featured: fund.isFeatured,
      badges,
      metrics: this.cardStats(fund).map(st => ({ label: st.label, value: st.value, tone: st.tone })),
      linkLabel: 'استعراض الصندوق',
      link: ['/funds', fund.slug || fund.id]
    };
  }

  private getClassificationBadge(fund: FundListItemDto): string {
    if (fund.effectiveClassification?.leafNameAr) return fund.effectiveClassification.leafNameAr;
    if (fund.effectiveClassification?.nameAr) return fund.effectiveClassification.nameAr;
    if (fund.effectiveClassification?.rootNameAr) return fund.effectiveClassification.rootNameAr;
    if (fund.classificationPathAr) {
      const parts = fund.classificationPathAr.split(' › ');
      if (parts.length > 0 && parts[parts.length - 1].trim()) return parts[parts.length - 1].trim();
    }
    return fund.typeNameAr || 'غير مصنف';
  }

  private cardStats(fund: FundListItemDto): EntityStat[] {
    const stats: EntityStat[] = [
      fund.currentPrice != null
        ? { label: 'السعر', value: `${fund.currentPrice} ${fund.currency || 'EGP'}` }
        : { label: 'السعر', value: null },
      fund.dailyChange != null
        ? { label: 'التغيير اليومي', value: `${fund.dailyChange > 0 ? '+' : ''}${fund.dailyChange}%`, tone: fund.dailyChange > 0 ? 'positive' : fund.dailyChange < 0 ? 'negative' : 'muted' }
        : { label: 'التغيير اليومي', value: null },
      fund.return1M != null
        ? { label: 'العائد 1M', value: `${fund.return1M > 0 ? '+' : ''}${fund.return1M.toFixed(2)}%`, tone: fund.return1M > 0 ? 'positive' : fund.return1M < 0 ? 'negative' : 'muted' }
        : { label: 'العائد 1M', value: null },
      fund.aum != null
        ? { label: 'الأصول (AUM)', value: `${(fund.aum / 1e6).toFixed(1)} م ${fund.currency || 'EGP'}` }
        : { label: 'الأصول (AUM)', value: null },
      fund.managementFee != null
        ? { label: 'الرسوم السنوية', value: `${fund.managementFee}%` }
        : { label: 'الرسوم السنوية', value: null }
    ];
    const riskLabel = fundRiskLabelAr(normFundRiskLevel(fund.riskLevel));
    if (riskLabel !== null) {
      stats.push({ label: 'المخاطر', value: riskLabel });
    }
    return stats;
  }

  private getFundIcon(type: FundType): any {
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
}
