import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ArrowLeft,
  Tag,
  Search,
  Filter,
  ChevronDown
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { navigateQueryParams } from '../../utils/navigation-utils';
import { StockCardComponent } from '../../components/stock-card/stock-card.component';
import { IndexSummaryDto, PagedResult, SectorSummaryDto, StockListItemDto } from '../../models/api.models';

@Component({
  selector: 'app-sector-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule, StockCardComponent],
  template: `
    <div *ngIf="loading && !sector" class="empty-state">
      <p>جارٍ تحميل بيانات القطاع...</p>
    </div>

    <div *ngIf="!loading && !sector" class="empty-state">
      <h3>القطاع غير موجود</h3>
      <a routerLink="/indices/Sectoral-Indices" class="text-link">العودة إلى القطاعات</a>
    </div>

    <div *ngIf="sector">
      <!-- Sector Hero -->
      <div class="page-intro index-detail-intro">
        <div>
          <a routerLink="/indices/Sectoral-Indices" class="back-link">
            <lucide-icon [img]="ArrowLeftIcon" size="15"></lucide-icon> العودة إلى القطاعات
          </a>
          <span class="eyebrow">قطاع اقتصادي</span>
          <h1>{{ sector.nameAr }}</h1>
          <p>{{ sector.nameEn }}</p>
        </div>

        <div class="index-stat">
          <strong>{{ totalCount }}</strong>
          <span>سهم في القطاع</span>
        </div>
      </div>

      <!-- Full Filter Bar (identical to stocks-list) -->
      <div class="filters">
        <!-- Main Row: Search, Multi-Index, Multi-Shariah, Fair Value Comparison, Min Sources -->
        <div class="filters-row-main">
          <div class="search-wrap">
            <lucide-icon [img]="SearchIcon" size="17"></lucide-icon>
            <input
              [(ngModel)]="search"
              (ngModelChange)="onSearchChange()"
              placeholder="ابحث في أسهم القطاع باسم السهم أو رمزه..."
              aria-label="البحث في أسهم القطاع" />
          </div>

          <!-- Multi-select Index Filter -->
          <div class="multi-dropdown" #indexDropdownRef>
            <div class="multi-dropdown-trigger" (click)="toggleDropdown('index')">
              <span class="trigger-text">{{ indexDropdownLabel }}</span>
              <lucide-icon [img]="ChevronDownIcon" size="14"></lucide-icon>
            </div>
            <div class="multi-dropdown-panel" *ngIf="openDropdown === 'index'">
              <label class="multi-dropdown-item" *ngFor="let idx of indices">
                <input
                  type="checkbox"
                  [checked]="isIndexSelected(idx.code)"
                  (change)="toggleIndex(idx.code)" />
                <span>{{ idx.code }} - {{ idx.nameAr }}</span>
              </label>
            </div>
          </div>

          <!-- Multi-select Shariah Status Filter -->
          <div class="multi-dropdown" #shariahDropdownRef>
            <div class="multi-dropdown-trigger" (click)="toggleDropdown('shariah')">
              <span class="trigger-text">{{ shariahDropdownLabel }}</span>
              <lucide-icon [img]="ChevronDownIcon" size="14"></lucide-icon>
            </div>
            <div class="multi-dropdown-panel" *ngIf="openDropdown === 'shariah'">
              <label class="multi-dropdown-item" *ngFor="let opt of shariahOptions">
                <input
                  type="checkbox"
                  [checked]="isShariahSelected(opt.value)"
                  (change)="toggleShariah(opt.value)" />
                <span>{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <!-- Price Comparison Filter (Cheap / Fair / Expensive) -->
          <select [(ngModel)]="priceComparison" (change)="onFilterChange()" aria-label="مقارنة القيمة العادلة">
            <option value="">القيمة العادلة: الكل</option>
            <option value="Cheap">أرخص من العادلة (فرصة)</option>
            <option value="Fair">قريبة من العادلة (±5%)</option>
            <option value="Expensive">أغلى من العادلة</option>
            <option value="Unavailable">لا يمكن حساب القيمة العادلة</option>
          </select>

          <!-- Min Compliant Sources Filter (1 to 7) -->
          <select [(ngModel)]="minCompliantSources" (change)="onFilterChange()" aria-label="الحد الأدنى للمصادر المتوافقة">
            <option value="">الجهات المتوافقة: الكل</option>
            <option value="3">3 جهات فأكثر</option>
            <option value="5">5 جهات فأكثر</option>
            <option value="7">إجماع كامل (7 من 7)</option>
          </select>
        </div>

        <!-- Secondary Row: P/E Slicer, P/B Slicer, Separate Sort Controls (Field + Direction), Page Size -->
        <div class="filters-row-secondary">
          <!-- P/E Slicer -->
          <div class="slicer-card">
            <div class="slicer-header">
              <span>مكرر الربحية (P/E)</span>
              <span>{{ minPe !== null ? minPe : 0 }} - {{ maxPe !== null ? maxPe : 100 }}</span>
            </div>
            <div class="slicer-inputs">
              <input
                type="number"
                placeholder="من"
                [ngModel]="minPe"
                (ngModelChange)="onPeMinChange($event)"
                min="0"
                max="100"
                aria-label="الحد الأدنى لمكرر الربحية" />
              <span>—</span>
              <input
                type="number"
                placeholder="إلى"
                [ngModel]="maxPe"
                (ngModelChange)="onPeMaxChange($event)"
                min="0"
                max="100"
                aria-label="الحد الأقصى لمكرر الربحية" />
            </div>
            <div class="slicer-slider-wrap">
              <input
                type="range"
                min="0"
                max="100"
                [ngModel]="maxPe !== null ? maxPe : 100"
                (ngModelChange)="onPeMaxChange($event)"
                aria-label="شريط أقصى مكرر ربحية" />
            </div>
          </div>

          <!-- P/B Slicer -->
          <div class="slicer-card">
            <div class="slicer-header">
              <span>مضاعف القيمة الدفترية (P/B)</span>
              <span>{{ minPb !== null ? minPb : 0 }} - {{ maxPb !== null ? maxPb : 20 }}</span>
            </div>
            <div class="slicer-inputs">
              <input
                type="number"
                step="0.5"
                placeholder="من"
                [ngModel]="minPb"
                (ngModelChange)="onPbMinChange($event)"
                min="0"
                max="20"
                aria-label="الحد الأدنى لمضاعف القيمة الدفترية" />
              <span>—</span>
              <input
                type="number"
                step="0.5"
                placeholder="إلى"
                [ngModel]="maxPb"
                (ngModelChange)="onPbMaxChange($event)"
                min="0"
                max="20"
                aria-label="الحد الأقصى لمضاعف القيمة الدفترية" />
            </div>
            <div class="slicer-slider-wrap">
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                [ngModel]="maxPb !== null ? maxPb : 20"
                (ngModelChange)="onPbMaxChange($event)"
                aria-label="شريط أقصى مضاعف قيمة دفترية" />
            </div>
          </div>

          <!-- Separate Sort Controls: Field + Direction -->
          <div class="sort-group">
            <select [(ngModel)]="sortBy" (change)="onSortFieldChange()" aria-label="حقل الترتيب">
              <option value="weight">الوزن النسبي</option>
              <option value="changePct">نسبة التغير</option>
              <option value="closingPrice">السعر</option>
              <option value="fairValueDiffPct">فارق العادلة</option>
              <option value="ticker">رمز السهم</option>
            </select>

            <select [(ngModel)]="sortDir" (change)="onSortDirChange()" aria-label="اتجاه الترتيب">
              <option value="desc">تنازلي (الأعلى أولاً)</option>
              <option value="asc">تصاعدي (الأدنى أولاً)</option>
            </select>
          </div>

          <!-- Page Size Pagination Control -->
          <div class="page-size-selector">
            <span>لكل صفحة:</span>
            <select [(ngModel)]="pageSize" (change)="onPageSizeChange()" aria-label="عدد الأسهم في الصفحة">
              <option [ngValue]="5">5</option>
              <option [ngValue]="10">10</option>
              <option [ngValue]="18">18</option>
              <option [ngValue]="50">50</option>
              <option [ngValue]="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Active Filters & Results Summary -->
      <div class="results-head">
        <span>{{ totalCount }} سهم في قطاع {{ sector.nameAr }} (الصفحة {{ page }} من {{ totalPages || 1 }})</span>
        <div class="active-filters-wrap">
          <!-- Index Filter Chips -->
          <ng-container *ngFor="let code of indexCodes">
            <span class="active-filter">
              المؤشر: {{ code }}
              <button (click)="removeIndex(code)">×</button>
            </span>
          </ng-container>

          <!-- Shariah Status Filter Chips -->
          <ng-container *ngFor="let st of shariahStatuses">
            <span class="active-filter">
              الحكم: {{ getShariahLabel(st) }}
              <button (click)="removeShariah(st)">×</button>
            </span>
          </ng-container>

          <span *ngIf="priceComparison" class="active-filter">
            التقييم: {{ getPriceComparisonLabel(priceComparison) }}
            <button (click)="clearFilter('priceComparison')">×</button>
          </span>
          <span *ngIf="minCompliantSources" class="active-filter">
            الجهات: ≥ {{ minCompliantSources }}
            <button (click)="clearFilter('minCompliantSources')">×</button>
          </span>
          <span *ngIf="minPe !== null || maxPe !== null" class="active-filter">
            مكرر الربحية: {{ minPe ?? 0 }} - {{ maxPe ?? '∞' }}
            <button (click)="clearPeFilter()">×</button>
          </span>
          <span *ngIf="minPb !== null || maxPb !== null" class="active-filter">
            مضاعف الدفترية: {{ minPb ?? 0 }} - {{ maxPb ?? '∞' }}
            <button (click)="clearPbFilter()">×</button>
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="stocksLoading" class="empty-state">
        <p>جارٍ تحميل أسهم القطاع...</p>
      </div>

      <!-- Stock Grid -->
      <div class="stock-grid" *ngIf="!stocksLoading && stocks.length">
        <app-stock-card
          *ngFor="let s of stocks; let i = index"
          [style.--item-index]="i"
          [ticker]="s.ticker"
          [nameAr]="s.nameAr"
          [nameEn]="s.nameEn"
          [closingPrice]="s.closingPrice"
          [changePct]="s.changePct"
          [fairValue]="s.fairValue"
          [priceComparison]="s.priceComparison"
          [fairValueDiffPct]="s.fairValueDiffPct"
          [shariahStatus]="s.shariahStatus"
          [indices]="s.indices"
          [weight]="s.weight"
          [currency]="s.currency"
          [sectorNameAr]="s.sectorNameAr || sector?.nameAr"
          [showFavorite]="true">
        </app-stock-card>
      </div>

      <!-- Empty -->
      <div *ngIf="!stocksLoading && !stocks.length" class="empty-state">
        <lucide-icon [img]="SearchIcon" size="32"></lucide-icon>
        <h3>لا توجد أسهم مطابقة للفلاتر المختارة</h3>
        <p>جرّب إزالة أحد الفلاتر لتوسيع النتائج.</p>
      </div>

      <!-- Pagination -->
      <div class="pagination-wrap" *ngIf="totalPages > 1">
        <button [disabled]="page <= 1" (click)="setPage(page - 1)">السابق</button>
        <ng-container *ngFor="let p of pageNumbers">
          <button [class.active]="p === page" (click)="setPage(p)">{{ p }}</button>
        </ng-container>
        <button [disabled]="page >= totalPages" (click)="setPage(page + 1)">التالي</button>
      </div>
    </div>
  `
})
export class SectorDetailComponent implements OnInit {
  readonly ArrowLeftIcon = ArrowLeft;
  readonly TagIcon = Tag;
  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;
  readonly ChevronDownIcon = ChevronDown;

  readonly shariahOptions = [
    { value: 'Compliant', label: 'متوافق شرعاً' },
    { value: 'NonCompliant', label: 'غير متوافق' },
    { value: 'Pending', label: 'قيد المراجعة / مشكل' },
    { value: 'Blocked', label: 'محظور' }
  ];

  sectorId: number | null = null;
  sector?: SectorSummaryDto | null;
  stocks: StockListItemDto[] = [];
  indices: IndexSummaryDto[] = [];
  totalCount = 0;
  totalPages = 1;
  loading = true;
  stocksLoading = false;

  page = 1;
  pageSize = 18;
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

  // Dropdown state
  openDropdown: 'index' | 'shariah' | null = null;

  private searchDebounceTimer?: any;
  private slicerDebounceTimer?: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private elementRef: ElementRef
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.openDropdown = null;
    }
  }

  ngOnInit(): void {
    this.api.getIndices().subscribe({
      next: (data) => (this.indices = data || [])
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.sectorId = id ? Number(id) : null;
      if (this.sectorId) {
        this.loadSectorInfo();
      } else {
        this.loading = false;
      }
    });

    this.route.queryParams.subscribe((params) => {
      this.page = params['page'] ? Number(params['page']) : 1;
      this.pageSize = params['pageSize'] ? Number(params['pageSize']) : 18;
      this.search = params['search'] || '';

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

      if (this.sectorId) {
        this.loadStocks();
      }
    });
  }

  private loadSectorInfo(): void {
    this.loading = true;
    this.api.getSectors().subscribe({
      next: (sectors) => {
        this.sector = sectors.find((s) => s.id === this.sectorId) ?? null;
        this.loading = false;
      },
      error: () => {
        this.sector = null;
        this.loading = false;
      }
    });
  }

  get indexDropdownLabel(): string {
    if (!this.indexCodes.length) return 'كل المؤشرات';
    if (this.indexCodes.length === 1) return `المؤشر: ${this.indexCodes[0]}`;
    return `المؤشرات (${this.indexCodes.length})`;
  }

  get shariahDropdownLabel(): string {
    if (!this.shariahStatuses.length) return 'كل الأحكام الشرعية';
    if (this.shariahStatuses.length === 1) return this.getShariahLabel(this.shariahStatuses[0]);
    return `الأحكام (${this.shariahStatuses.length})`;
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

  toggleDropdown(name: 'index' | 'shariah'): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  isIndexSelected(code: string): boolean {
    return this.indexCodes.includes(code);
  }

  toggleIndex(code: string): void {
    if (this.isIndexSelected(code)) {
      this.indexCodes = this.indexCodes.filter(c => c !== code);
    } else {
      this.indexCodes = [...this.indexCodes, code];
    }
    this.page = 1;
    this.updateUrl();
  }

  removeIndex(code: string): void {
    this.indexCodes = this.indexCodes.filter(c => c !== code);
    this.page = 1;
    this.updateUrl();
  }

  isShariahSelected(val: string): boolean {
    return this.shariahStatuses.includes(val);
  }

  toggleShariah(val: string): void {
    if (this.isShariahSelected(val)) {
      this.shariahStatuses = this.shariahStatuses.filter(s => s !== val);
    } else {
      this.shariahStatuses = [...this.shariahStatuses, val];
    }
    this.page = 1;
    this.updateUrl();
  }

  removeShariah(val: string): void {
    this.shariahStatuses = this.shariahStatuses.filter(s => s !== val);
    this.page = 1;
    this.updateUrl();
  }

  loadStocks(): void {
    this.stocksLoading = true;
    this.api.getStocks({
      page: this.page,
      pageSize: this.pageSize,
      sectorId: this.sectorId ?? undefined,
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
    }).subscribe({
      next: (res: PagedResult<StockListItemDto>) => {
        this.stocks = res.items || [];
        this.totalCount = res.totalCount || 0;
        this.totalPages = res.totalPages || Math.ceil(this.totalCount / this.pageSize) || 1;
        this.stocksLoading = false;
      },
      error: () => {
        this.stocks = [];
        this.stocksLoading = false;
      }
    });
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
    this.page = 1;
    this.updateUrl();
  }

  setPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.updateUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pageNumbers(): number[] {
    const list: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.page - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
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
      sortBy: this.sortBy !== 'changePct' ? this.sortBy : null,
      sortDir: this.sortDir !== 'desc' ? this.sortDir : null
    };

    // replaceUrl + equality guard live in the helper so Back always
    // leaves the page instead of stepping through param states.
    navigateQueryParams(this.router, this.route, queryParams);
  }
}
