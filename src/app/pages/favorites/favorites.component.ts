import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Search, Star, Trash2 } from 'lucide-angular';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { FavoritesService } from '../../services/favorites.service';
import { StockCardComponent } from '../../components/stock-card/stock-card.component';
import { StockListItemDto } from '../../models/api.models';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, StockCardComponent],
  template: `
    <div class="page-intro">
      <div>
        <span class="eyebrow">قائمتك الخاصة · {{ favCount }} سهم</span>
        <h1>المفضلة</h1>
        <p>الأسهم التي حفظتها بنجمة، ببياناتها الحية نفسها: الحكم الشرعي ونسبة التغير.</p>
      </div>
      <div class="intro-note">
        <lucide-icon [img]="StarIcon" size="17"></lucide-icon>
        <span>تُحفظ على هذا الجهاز فقط</span>
      </div>
    </div>

    <div class="storage-note" *ngIf="!favorites.persisted()">
      <span>التخزين غير متاح في هذا المتصفح — ستعمل المفضلة لهذه الجلسة فقط ولن تُحفظ.</span>
    </div>

    <!-- Empty favorites -->
    <div *ngIf="!loading && !loadError && favCount === 0" class="empty-state">
      <lucide-icon [img]="StarIcon" size="32"></lucide-icon>
      <h3>لا توجد أسهم في المفضلة بعد</h3>
      <p>اضغط على النجمة في أي سهم لحفظه هنا ومتابعته.</p>
      <a routerLink="/stocks" class="btn btn-primary">تصفح الأسهم</a>
    </div>

    <ng-container *ngIf="favCount > 0">
      <!-- Controls: search + sort + clear -->
      <div class="filters fav-controls">
        <div class="search-wrap">
          <lucide-icon [img]="SearchIcon" size="17"></lucide-icon>
          <input
            [(ngModel)]="search"
            placeholder="ابحث في المفضلة باسم السهم أو رمزه..."
            aria-label="البحث في المفضلة" />
        </div>
        <select [(ngModel)]="sortBy" aria-label="ترتيب المفضلة">
          <option value="name">الترتيب: الاسم</option>
          <option value="changePct">الترتيب: نسبة التغير</option>
          <option value="shariahStatus">الترتيب: الحكم الشرعي</option>
        </select>
        <button
          *ngIf="!confirmingClear"
          type="button"
          class="btn btn-outline btn-sm"
          (click)="confirmingClear = true">
          <lucide-icon [img]="TrashIcon" size="15"></lucide-icon> مسح الكل
        </button>
        <span *ngIf="confirmingClear" class="clear-confirm">
          <span>تأكيد مسح كل المفضلة؟</span>
          <button type="button" class="btn btn-primary btn-sm" (click)="clearAll()">تأكيد</button>
          <button type="button" class="btn btn-outline btn-sm" (click)="confirmingClear = false">تراجع</button>
        </span>
      </div>

      <!-- Loading skeletons -->
      <div *ngIf="loading" class="stock-grid" aria-hidden="true">
        <div class="skeleton-card" *ngFor="let n of [1, 2, 3]">
          <div class="sk-line sk-title"></div>
          <div class="sk-line sk-text"></div>
          <div class="sk-line sk-price"></div>
          <div class="sk-line sk-badges"></div>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="!loading && loadError" class="empty-state">
        <lucide-icon [img]="SearchIcon" size="32"></lucide-icon>
        <h3>تعذّر تحميل بيانات الأسهم</h3>
        <p>تحقق من الاتصال ثم حاول مرة أخرى.</p>
        <button type="button" class="btn btn-primary" (click)="reload()">إعادة المحاولة</button>
      </div>

      <!-- Cards -->
      <div class="stock-grid" *ngIf="!loading && !loadError && visibleStocks.length">
        <app-stock-card
          *ngFor="let s of visibleStocks; let i = index; trackBy: trackStockByTicker"
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
          [currency]="s.currency"
          [sectorNameAr]="s.sectorNameAr"
          [coreActivityCompliant]="s.coreActivityCompliant"
          [categoryAr]="s.categoryAr"
          [spHaramEarningPercentage]="s.spHaramEarningPercentage"
          [loansPercentage]="s.loansPercentage"
          [showFavorite]="true">
        </app-stock-card>
      </div>

      <!-- No search match -->
      <div *ngIf="!loading && !loadError && !visibleStocks.length" class="empty-state">
        <lucide-icon [img]="SearchIcon" size="32"></lucide-icon>
        <h3>لا توجد نتائج مطابقة للبحث في المفضلة</h3>
        <p>جرّب كلمة بحث مختلفة.</p>
      </div>
    </ng-container>
  `
})
export class FavoritesComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly StarIcon = Star;
  readonly TrashIcon = Trash2;

  search = '';
  sortBy: 'name' | 'changePct' | 'shariahStatus' = 'name';
  confirmingClear = false;
  loading = false;
  loadError = false;

  private allStocks: StockListItemDto[] = [];

  constructor(
    private readonly api: ApiService,
    readonly favorites: FavoritesService
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  get favCount(): number {
    return this.favorites.count();
  }

  /** Favorite stocks with live data, searched + sorted. Unknown symbols vanish here. */
  get visibleStocks(): StockListItemDto[] {
    const favs = new Set(this.favorites.favorites());
    let list = this.allStocks.filter((s) => favs.has(FavoritesService.normalize(s.ticker)));
    const q = this.search.trim();
    if (q) {
      const needle = q.toUpperCase();
      list = list.filter((s) =>
        s.ticker.toUpperCase().includes(needle) ||
        (s.nameAr || '').includes(q) ||
        (s.nameEn || '').toUpperCase().includes(needle));
    }
    const by = this.sortBy;
    return [...list].sort((a, b) => {
      if (by === 'changePct') return (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity);
      if (by === 'shariahStatus') return this.verdictRank(a.shariahStatus) - this.verdictRank(b.shariahStatus);
      return (a.nameAr || a.ticker).localeCompare(b.nameAr || b.ticker, 'ar');
    });
  }

  reload(): void {
    if (this.favCount === 0) {
      this.allStocks = [];
      this.loading = false;
      this.loadError = false;
      return;
    }
    this.loading = true;
    this.loadError = false;
    this.fetchAllStocks().subscribe({
      next: (stocks) => {
        this.allStocks = stocks;
        this.favorites.pruneUnknown(stocks.map((s) => s.ticker));
        this.loading = false;
      },
      error: () => {
        this.allStocks = [];
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  clearAll(): void {
    this.favorites.clear();
    this.confirmingClear = false;
  }

  /**
   * Stable identity for favorite cards. visibleStocks is a getter returning a
   * fresh array every change-detection cycle; without trackBy, each cycle
   * would remount every card and replay its entrance animation.
   */
  trackStockByTicker(_index: number, s: StockListItemDto): string {
    return s.ticker;
  }

  private verdictRank(status?: string | null): number {
    const s = (status || '').toLowerCase().replace(/[-_ ]/g, '');
    if (s === 'compliant' || s === 'متوافق') return 0;
    if (s === 'doubtful' || s === 'مشكوك' || s === 'pending') return 1;
    if (s === 'noncompliant' || s === 'غيرمتوافق') return 2;
    if (s === 'blocked' || s === 'محظور') return 3;
    return 4;
  }

  /** Collects every stocks page (100/page) so no favorite is missed. */
  private fetchAllStocks(): Observable<StockListItemDto[]> {
    return this.api.getStocks({ page: 1, pageSize: 100 }).pipe(
      expand((res, index) => {
        const collected = (index + 1) * 100;
        return collected < (res.totalCount || 0)
          ? this.api.getStocks({ page: index + 2, pageSize: 100 })
          : EMPTY;
      }),
      map((res) => res.items || []),
      reduce((acc, items) => acc.concat(items), [] as StockListItemDto[])
    );
  }
}
