import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ArrowLeft,
  Tag,
  Search
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { StockCardComponent } from '../../components/stock-card/stock-card.component';
import { PagedResult, SectorSummaryDto, StockListItemDto } from '../../models/api.models';

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

      <!-- Filters -->
      <div class="filters" style="grid-template-columns: 2fr 1fr 1fr 1fr;">
        <div class="search-wrap">
          <lucide-icon [img]="SearchIcon" size="17"></lucide-icon>
          <input
            [(ngModel)]="search"
            (ngModelChange)="onSearchChange()"
            placeholder="ابحث في أسهم القطاع..." />
        </div>

        <select [(ngModel)]="shariahStatus" (change)="onFilterChange()" aria-label="حكم الشريعة">
          <option value="">كل الأحكام الشرعية</option>
          <option value="Compliant">متوافق شرعاً</option>
          <option value="NonCompliant">غير متوافق</option>
          <option value="Pending">قيد المراجعة</option>
          <option value="Blocked">محظور</option>
        </select>

        <select [(ngModel)]="priceComparison" (change)="onFilterChange()" aria-label="القيمة العادلة">
          <option value="">كل التقييمات العادلة</option>
          <option value="Cheap">أرخص من العادلة</option>
          <option value="Fair">قريبة من العادلة</option>
          <option value="Expensive">أغلى من العادلة</option>
          <option value="Unavailable">لا يمكن حساب القيمة العادلة</option>
        </select>

        <select [(ngModel)]="sortSelection" (change)="onSortChange()" aria-label="ترتيب النتائج">
          <option value="changePct:desc">التغير (الأعلى أولاً)</option>
          <option value="changePct:asc">التغير (الأدنى أولاً)</option>
          <option value="closingPrice:desc">السعر (الأعلى أولاً)</option>
          <option value="closingPrice:asc">السعر (الأدنى أولاً)</option>
          <option value="fairValueDiffPct:desc">فارق العادلة (الأعلى)</option>
          <option value="ticker:asc">رمز السهم (أ–ي)</option>
        </select>
      </div>

      <div class="results-head">
        <span>{{ totalCount }} سهم في قطاع {{ sector.nameAr }} (الصفحة {{ page }} من {{ totalPages || 1 }})</span>
      </div>

      <!-- Loading -->
      <div *ngIf="stocksLoading" class="empty-state">
        <p>جارٍ تحميل أسهم القطاع...</p>
      </div>

      <!-- Stock Grid -->
      <div class="stock-grid" *ngIf="!stocksLoading && stocks.length">
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
          [sectorNameAr]="s.sectorNameAr || sector?.nameAr">
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

  sectorId: number | null = null;
  sector?: SectorSummaryDto | null;
  stocks: StockListItemDto[] = [];
  totalCount = 0;
  totalPages = 1;
  loading = true;
  stocksLoading = false;

  page = 1;
  pageSize = 18;
  search = '';
  shariahStatus = '';
  priceComparison = '';
  sortBy = 'changePct';
  sortDir = 'desc';
  sortSelection = 'changePct:desc';

  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.sectorId = id ? Number(id) : null;
      if (this.sectorId) {
        this.loadSectorInfo();
        this.loadStocks();
      } else {
        this.loading = false;
      }
    });
  }

  /** Load sector metadata from the sectors list (reuse getSectors). */
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

  loadStocks(): void {
    this.stocksLoading = true;
    this.api.getStocks({
      page: this.page,
      pageSize: this.pageSize,
      sectorId: this.sectorId ?? undefined,
      search: this.search || undefined,
      shariahStatus: this.shariahStatus || undefined,
      priceComparison: this.priceComparison || undefined,
      sortBy: this.sortBy,
      sortDir: this.sortDir
    }).subscribe({
      next: (res: PagedResult<StockListItemDto>) => {
        this.stocks = res.items || [];
        this.totalCount = res.totalCount || 0;
        this.totalPages = res.totalPages || 1;
        this.stocksLoading = false;
      },
      error: () => {
        this.stocks = [];
        this.stocksLoading = false;
      }
    });
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.loadStocks();
    }, 350);
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadStocks();
  }

  onSortChange(): void {
    const [by, dir] = this.sortSelection.split(':');
    this.sortBy = by;
    this.sortDir = dir;
    this.page = 1;
    this.loadStocks();
  }

  setPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.loadStocks();
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
}
