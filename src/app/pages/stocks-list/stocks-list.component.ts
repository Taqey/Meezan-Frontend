import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { StockCardComponent } from '../../components/stock-card/stock-card.component';
import { IndexSummaryDto, PagedResult, StockListItemDto } from '../../models/api.models';

@Component({
  selector: 'app-stocks-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, StockCardComponent],
  template: `
    <div class="page-intro">
      <div>
        <span class="eyebrow">البورصة المصرية · {{ totalCount }} سهم متوفر</span>
        <h1>الأسهم</h1>
        <p>ابحث، صفِّ، وقارن تقييمات الأسهم وأحكام الشريعة بناءً على بيانات المؤشرات ونماذج القيمة العادلة المعتمدة.</p>
      </div>
      <div class="intro-note">
        <lucide-icon [img]="FilterIcon" size="17"></lucide-icon>
        <span>جميع الفلاتر مرتبطة بالرابط وتعمل معاً عبر قاعدة البيانات</span>
      </div>
    </div>

    <!-- Filter Bar conforming to backend contract -->
    <div class="filters">
      <div class="search-wrap">
        <lucide-icon [img]="SearchIcon" size="17"></lucide-icon>
        <input
          [(ngModel)]="search"
          (ngModelChange)="onSearchChange()"
          placeholder="ابحث باسم السهم أو رمزه (مثال: COMI أو فوري)..."
          aria-label="البحث عن سهم" />
      </div>

      <!-- Index Filter -->
      <select [(ngModel)]="indexCode" (change)="onFilterChange()" aria-label="تصفية حسب المؤشر">
        <option value="">كل المؤشرات</option>
        <option *ngFor="let idx of indices" [value]="idx.code">{{ idx.code }} - {{ idx.nameAr }}</option>
      </select>

      <!-- Shariah Status Filter (Compliant / NonCompliant / Pending / Blocked) -->
      <select [(ngModel)]="shariahStatus" (change)="onFilterChange()" aria-label="حكم الشريعة">
        <option value="">كل الأحكام الشرعية</option>
        <option value="Compliant">متوافق شرعاً</option>
        <option value="NonCompliant">غير متوافق</option>
        <option value="Pending">قيد المراجعة / مشكل</option>
        <option value="Blocked">محظور</option>
      </select>

      <!-- Price Comparison Filter (Cheap / Fair / Expensive) -->
      <select [(ngModel)]="priceComparison" (change)="onFilterChange()" aria-label="مقارنة القيمة العادلة">
        <option value="">القيمة العادلة: الكل</option>
        <option value="Cheap">أرخص من العادلة (فرصة)</option>
        <option value="Fair">قريبة من العادلة (±5%)</option>
        <option value="Expensive">أغلى من العادلة</option>
      </select>

      <!-- Min Compliant Sources Filter (1 to 7) -->
      <select [(ngModel)]="minCompliantSources" (change)="onFilterChange()" aria-label="الحد الأدنى للمصادر المتوافقة">
        <option value="">الجهات المتوافقة: الكل</option>
        <option value="3">3 جهات فأكثر</option>
        <option value="5">5 جهات فأكثر</option>
        <option value="7">إجماع كامل (7 من 7)</option>
      </select>

      <!-- Sort By & Sort Direction -->
      <select [(ngModel)]="sortSelection" (change)="onSortSelectionChange()" aria-label="ترتيب النتائج">
        <option value="changePct:desc">نسبة التغير (الأعلى أولاً)</option>
        <option value="changePct:asc">نسبة التغير (الأدنى أولاً)</option>
        <option value="closingPrice:desc">السعر (الأعلى أولاً)</option>
        <option value="closingPrice:asc">السعر (الأدنى أولاً)</option>
        <option value="fairValueDiffPct:desc">فارق العادلة (الأعلى أولاً)</option>
        <option value="ticker:asc">رمز السهم (أ-ي)</option>
      </select>
    </div>

    <!-- Active Filters & Results Summary -->
    <div class="results-head">
      <span>{{ totalCount }} نتيجة مطابقة (الصفحة {{ page }} من {{ totalPages || 1 }})</span>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span *ngIf="indexCode" class="active-filter">
          المؤشر: {{ indexCode }}
          <button (click)="clearFilter('indexCode')">×</button>
        </span>
        <span *ngIf="shariahStatus" class="active-filter">
          الحكم: {{ shariahStatus }}
          <button (click)="clearFilter('shariahStatus')">×</button>
        </span>
        <span *ngIf="priceComparison" class="active-filter">
          التقييم: {{ priceComparison }}
          <button (click)="clearFilter('priceComparison')">×</button>
        </span>
        <span *ngIf="minCompliantSources" class="active-filter">
          الجهات: ≥ {{ minCompliantSources }}
          <button (click)="clearFilter('minCompliantSources')">×</button>
        </span>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div *ngIf="loading" class="empty-state">
      <p>جارٍ تحميل بيانات الأسهم من الخادم...</p>
    </div>

    <!-- Stock Cards Grid -->
    <div class="stock-grid" *ngIf="!loading && stocks.length">
      <app-stock-card
        *ngFor="let s of stocks"
        [ticker]="s.ticker"
        [nameAr]="s.nameAr"
        [nameEn]="s.nameEn"
        [closingPrice]="s.closingPrice"
        [changePct]="s.changePct"
        [fairValue]="s.fairValue"
        [priceComparison]="s.priceComparison"
        [shariahStatus]="s.shariahStatus"
        [indices]="s.indices"
        [currency]="s.currency"
        [sectorNameAr]="s.sectorNameAr">
      </app-stock-card>
    </div>

    <!-- Empty State -->
    <div *ngIf="!loading && !stocks.length" class="empty-state">
      <lucide-icon [img]="SearchIcon" size="32"></lucide-icon>
      <h3>لا توجد نتائج مطابقة للفلاتر المختارة</h3>
      <p>جرّب تعديل خيارات البحث أو إزالة أحد الفلاتر لتوسيع نطاق النتائج.</p>
    </div>

    <!-- PagedResult Pagination UI -->
    <div class="pagination-wrap" *ngIf="totalPages > 1">
      <button [disabled]="page <= 1" (click)="setPage(page - 1)">
        السابق
      </button>

      <ng-container *ngFor="let p of pageNumbers">
        <button [class.active]="p === page" (click)="setPage(p)">
          {{ p }}
        </button>
      </ng-container>

      <button [disabled]="page >= totalPages" (click)="setPage(page + 1)">
        التالي
      </button>
    </div>
  `
})
export class StocksListComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;

  stocks: StockListItemDto[] = [];
  indices: IndexSummaryDto[] = [];
  totalCount = 0;
  totalPages = 1;
  loading = false;

  // Filter params
  page = 1;
  pageSize = 18;
  search = '';
  indexCode = '';
  shariahStatus = '';
  priceComparison = '';
  minCompliantSources = '';
  sortBy = 'changePct';
  sortDir = 'desc';
  sortSelection = 'changePct:desc';

  private searchDebounceTimer?: any;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.api.getIndices().subscribe({
      next: (data) => (this.indices = data || [])
    });

    this.route.queryParams.subscribe((params) => {
      this.page = params['page'] ? Number(params['page']) : 1;
      this.pageSize = params['pageSize'] ? Number(params['pageSize']) : 18;
      this.search = params['search'] || '';
      this.indexCode = params['indexCode'] || '';
      this.shariahStatus = params['shariahStatus'] || '';
      this.priceComparison = params['priceComparison'] || '';
      this.minCompliantSources = params['minCompliantSources'] || '';
      this.sortBy = params['sortBy'] || 'changePct';
      this.sortDir = params['sortDir'] || 'desc';
      this.sortSelection = `${this.sortBy}:${this.sortDir}`;

      this.fetchStocks();
    });
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

  fetchStocks(): void {
    this.loading = true;
    this.api.getStocks({
      page: this.page,
      pageSize: this.pageSize,
      search: this.search || undefined,
      indexCode: this.indexCode || undefined,
      shariahStatus: this.shariahStatus || undefined,
      priceComparison: this.priceComparison || undefined,
      minCompliantSources: this.minCompliantSources ? Number(this.minCompliantSources) : undefined,
      sortBy: this.sortBy,
      sortDir: this.sortDir
    }).subscribe({
      next: (res) => {
        this.stocks = res.items || [];
        this.totalCount = res.totalCount || 0;
        this.totalPages = res.totalPages || Math.ceil(this.totalCount / this.pageSize) || 1;
        this.loading = false;
      },
      error: () => {
        this.stocks = [];
        this.loading = false;
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

  onSortSelectionChange(): void {
    const [by, dir] = this.sortSelection.split(':');
    this.sortBy = by;
    this.sortDir = dir;
    this.page = 1;
    this.updateUrl();
  }

  clearFilter(key: string): void {
    if (key === 'indexCode') this.indexCode = '';
    if (key === 'shariahStatus') this.shariahStatus = '';
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

  private updateUrl(): void {
    const queryParams: any = {
      page: this.page > 1 ? this.page : null,
      search: this.search || null,
      indexCode: this.indexCode || null,
      shariahStatus: this.shariahStatus || null,
      priceComparison: this.priceComparison || null,
      minCompliantSources: this.minCompliantSources || null,
      sortBy: this.sortBy !== 'changePct' ? this.sortBy : null,
      sortDir: this.sortDir !== 'desc' ? this.sortDir : null
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }
}
