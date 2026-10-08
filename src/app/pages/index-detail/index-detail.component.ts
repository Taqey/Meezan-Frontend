import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ArrowLeft,
  Search,
  Filter,
  ChevronDown
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { navigateQueryParams } from '../../utils/navigation-utils';
import { StockCardComponent } from '../../components/stock-card/stock-card.component';
import { ConstituentItemDto, IndexConstituentsPagedResultDto } from '../../models/api.models';

@Component({
  selector: 'app-index-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule, StockCardComponent],
  template: `
    <div *ngIf="loading" class="empty-state">
      <p>جارٍ تحميل بيانات مكونات المؤشر...</p>
    </div>

    <div *ngIf="!loading && !result" class="empty-state">
      <h3>المؤشر غير موجود</h3>
      <a routerLink="/indices" class="text-link">العودة إلى المؤشرات</a>
    </div>

    <div *ngIf="result">
      <div class="page-intro index-detail-intro">
        <div>
          <a routerLink="/indices" class="back-link">
            <lucide-icon [img]="ArrowLeftIcon" size="15"></lucide-icon> العودة إلى المؤشرات
          </a>
          <span class="eyebrow">مؤشر البورصة الرسمية</span>
          <h1>{{ result.indexNameAr || result.indexCode }}</h1>
          <p>{{ result.indexNameEn }} · كود المؤشر: {{ result.indexCode }}</p>
        </div>

        <div class="index-stat">
          <strong>{{ result.totalCount }}</strong>
          <span>سهم مكوّن</span>
          <small *ngIf="result.lastUpdated">تحديث: {{ result.lastUpdated | date:'yyyy-MM-dd' }}</small>
        </div>
      </div>

      <!-- Full Filter Bar (identical to stocks-list) -->
      <div class="filters">
        <!-- Main Row: Search, Multi-Shariah, Fair Value Comparison, Min Sources -->
        <div class="filters-row-main">
          <div class="search-wrap">
            <lucide-icon [img]="SearchIcon" size="17"></lucide-icon>
            <input
              [(ngModel)]="search"
              (ngModelChange)="onSearchChange()"
              placeholder="ابحث في أسهم المؤشر باسم السهم أو رمزه..."
              aria-label="البحث في أسهم المؤشر" />
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
              <option value="weight" *ngIf="hasWeights">الوزن النسبي</option>
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
              <option [ngValue]="20">20</option>
              <option [ngValue]="50">50</option>
              <option [ngValue]="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Active Filters & Results Summary -->
      <div class="results-head">
        <span>{{ result.totalCount }} سهم مكوّن (الصفحة {{ page }} من {{ result.totalPages || 1 }})</span>
        <div class="active-filters-wrap">
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

      <!-- Constituents Grid -->
      <div class="stock-grid" *ngIf="result.items && result.items.length">
        <app-stock-card
          *ngFor="let item of result.items; let i = index"
          [style.--item-index]="i"
          [ticker]="item.ticker"
          [nameAr]="item.nameAr"
          [nameEn]="item.nameEn"
          [closingPrice]="item.closingPrice"
          [changePct]="item.changePct"
          [fairValue]="item.fairValue"
          [priceComparison]="item.priceComparison"
          [fairValueDiffPct]="item.fairValueDiffPct"
          [shariahStatus]="item.shariahStatus"
          [indices]="item.indices"
          [weight]="item.weight"
          [currency]="item.currency"
          [sectorNameAr]="item.sectorNameAr"
          [showFavorite]="true">
        </app-stock-card>
      </div>

      <!-- Empty State -->
      <div *ngIf="!result.items?.length" class="empty-state">
        <p>لا توجد أسهم مطابقة لخيارات البحث داخل هذا المؤشر.</p>
      </div>

      <!-- Pagination -->
      <div class="pagination-wrap" *ngIf="result.totalPages > 1">
        <button [disabled]="page <= 1" (click)="setPage(page - 1)">السابق</button>
        <ng-container *ngFor="let p of pageNumbers">
          <button [class.active]="p === page" (click)="setPage(p)">{{ p }}</button>
        </ng-container>
        <button [disabled]="page >= result.totalPages" (click)="setPage(page + 1)">التالي</button>
      </div>
    </div>
  `
})
export class IndexDetailComponent implements OnInit {
  readonly ArrowLeftIcon = ArrowLeft;
  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;
  readonly ChevronDownIcon = ChevronDown;

  readonly shariahOptions = [
    { value: 'Compliant', label: 'متوافق شرعاً' },
    { value: 'NonCompliant', label: 'غير متوافق' },
    { value: 'Pending', label: 'قيد المراجعة / مشكل' },
    { value: 'Blocked', label: 'محظور' }
  ];

  code = '';
  result?: IndexConstituentsPagedResultDto | null;
  loading = true;

  page = 1;
  pageSize = 20;
  search = '';
  shariahStatuses: string[] = [];
  priceComparison = '';
  minCompliantSources = '';
  sortBy = 'weight';
  sortDir = 'desc';

  // PE & PB filters
  minPe: number | null = null;
  maxPe: number | null = null;
  minPb: number | null = null;
  maxPb: number | null = null;

  // Dropdown state
  openDropdown: 'shariah' | null = null;

  private searchDebounceTimer?: any;
  private slicerDebounceTimer?: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private elementRef: ElementRef
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.openDropdown = null;
    }
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.code = params.get('code') || '';
    });

    this.route.queryParams.subscribe((params) => {
      this.page = params['page'] ? Number(params['page']) : 1;
      this.pageSize = params['pageSize'] ? Number(params['pageSize']) : 20;
      this.search = params['search'] || '';

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
      this.sortBy = params['sortBy'] || 'weight';
      this.sortDir = params['sortDir'] || 'desc';

      this.minPe = params['minPe'] !== undefined && params['minPe'] !== null ? Number(params['minPe']) : null;
      this.maxPe = params['maxPe'] !== undefined && params['maxPe'] !== null ? Number(params['maxPe']) : null;
      this.minPb = params['minPb'] !== undefined && params['minPb'] !== null ? Number(params['minPb']) : null;
      this.maxPb = params['maxPb'] !== undefined && params['maxPb'] !== null ? Number(params['maxPb']) : null;

      if (this.code) {
        this.loadConstituents();
      }
    });
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

  toggleDropdown(name: 'shariah'): void {
    this.openDropdown = this.openDropdown === name ? null : name;
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

  loadConstituents(): void {
    this.loading = true;
    this.api.getIndexConstituents(this.code, {
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
    }).subscribe({
      next: (data) => {
        this.result = data;
        this.loading = false;
        // A "weight" sort is meaningless for indices without weight data
        // (all weights null/zero): fall back to alphabetical so the list is
        // never left on a broken sort. Runs once per response — no loop,
        // because sortBy is already 'ticker' on the reloaded request.
        if (!this.hasWeights && this.sortBy === 'weight') {
          this.sortBy = 'ticker';
          this.sortDir = 'asc';
          this.page = 1;
          this.updateUrl();
        }
      },
      error: () => {
        this.result = null;
        this.loading = false;
      }
    });
  }

  /**
   * True when the loaded constituents carry real weight data (non-null and
   * non-zero for at least some stocks). Decided per index from the actual API
   * response — never from a hardcoded index list. Unknown until data arrives,
   * and re-evaluated on every load (index switch, filter, page).
   */
  get hasWeights(): boolean {
    const items = this.result?.items;
    return !!items && items.some((it) => it.weight != null && it.weight !== 0);
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
    if (!this.result || p < 1 || p > this.result.totalPages || p === this.page) return;
    this.page = p;
    this.updateUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pageNumbers(): number[] {
    const list: number[] = [];
    const total = this.result?.totalPages || 1;
    const maxVisible = 5;
    let start = Math.max(1, this.page - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
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
      sortDir: this.sortDir !== 'desc' ? this.sortDir : null
    };

    // replaceUrl + equality guard live in the helper: automatic resets
    // (e.g. the weight-sort fallback) must not trap the Back button.
    navigateQueryParams(this.router, this.route, queryParams);
  }
}
