import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Star, Trash2 } from 'lucide-angular';
import { EMPTY, Observable, expand, map, reduce, forkJoin, of, catchError } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { FavoritesService } from '../../services/favorites.service';
import { StockListItemDto, FundListItemDto } from '../../models/api.models';
import {
  MzListingPageComponent,
  MzButtonComponent,
  MzBadgeComponent,
  stockToCard,
  fundToCard,
  type MzListingConfig
} from '../../components/ui';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MzListingPageComponent,
    MzButtonComponent,
    MzBadgeComponent
  ],
  template: `
    <mz-listing-page
      [config]="listingConfig"
      (tabChange)="activeTab = $event"
      (searchChange)="search = $event"
      (sortChange)="onSortChange($event)"
      (retry)="reload()">
      <ng-container actions>
        <mz-badge tone="default" [pill]="true">
          <lucide-icon [img]="StarIcon" [size]="14"></lucide-icon>
          <span>تُحفظ على هذا الجهاز فقط</span>
        </mz-badge>
        <ng-container *ngIf="favCount > 0">
          <mz-button
            *ngIf="!confirmingClear"
            variant="default"
            [icon]="TrashIcon"
            (clicked)="confirmingClear = true">
            مسح الكل
          </mz-button>
          <span *ngIf="confirmingClear" class="fav-clear-confirm">
            <span class="fav-clear-label">تأكيد مسح كل المفضلة؟</span>
            <mz-button variant="primary" (clicked)="clearAll()">تأكيد</mz-button>
            <mz-button variant="default" (clicked)="confirmingClear = false">تراجع</mz-button>
          </span>
        </ng-container>
      </ng-container>

      <div resultsExtra *ngIf="!favorites.persisted()" class="fav-storage-warn">
        <span>التخزين غير متاح في هذا المتصفح — ستعمل المفضلة لهذه الجلسة فقط ولن تُحفظ.</span>
      </div>

      <div footer *ngIf="!loading && !loadError && favCount === 0" class="fav-empty-cta">
        <mz-button variant="primary" link="/stocks">تصفح الأسهم</mz-button>
        <span style="width: 12px; display: inline-block;"></span>
        <mz-button variant="default" link="/funds">تصفح الصناديق</mz-button>
      </div>
    </mz-listing-page>
  `,
  styles: [`
    .fav-clear-confirm {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      background: var(--mz-surface-low, #f2f3ff);
      border: 1px solid rgba(188, 202, 192, 0.4);
      padding: 4px 10px;
      border-radius: 12px;
    }
    .fav-clear-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--mz-on-surface, #131b2e);
    }
    .fav-storage-warn {
      font-size: 12px;
      font-weight: 600;
      color: var(--mz-warn, #b47b20);
      background: var(--mz-warn-soft, #fff4d9);
      padding: 6px 12px;
      border-radius: 8px;
    }
    .fav-empty-cta {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: -20px;
      margin-bottom: 32px;
    }
  `]
})
export class FavoritesComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly StarIcon = Star;
  readonly TrashIcon = Trash2;

  search = '';
  activeTab = 'all';
  sortBy: 'name' | 'changePct' | 'shariahStatus' = 'name';
  confirmingClear = false;
  loading = false;
  loadError = false;

  readonly sortOptions = [
    { value: 'name', label: 'الترتيب: الاسم' },
    { value: 'changePct', label: 'الترتيب: نسبة التغير' },
    { value: 'shariahStatus', label: 'الترتيب: الحكم الشرعي' }
  ];

  private allStocks: StockListItemDto[] = [];
  private allFunds: FundListItemDto[] = [];

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

  get stockFavCount(): number {
    return this.favorites.stockFavorites().length;
  }

  get fundFavCount(): number {
    return this.favorites.fundFavorites().length;
  }

  /** Favorite stocks with live data, searched + sorted. */
  get visibleStocks(): StockListItemDto[] {
    const favs = new Set(this.favorites.stockFavorites());
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

  /** Favorite funds with live data, searched + sorted. */
  get visibleFunds(): FundListItemDto[] {
    const favs = new Set(this.favorites.fundFavorites().map((c) => FavoritesService.normalize(c)));
    let list = this.allFunds.filter((f) => favs.has(FavoritesService.normalize(f.code)));
    const q = this.search.trim();
    if (q) {
      const needle = q.toUpperCase();
      list = list.filter((f) =>
        f.code.toUpperCase().includes(needle) ||
        (f.nameAr || '').includes(q) ||
        (f.displayName || '').includes(q) ||
        (f.nameEn || '').toUpperCase().includes(needle));
    }
    const by = this.sortBy;
    return [...list].sort((a, b) => {
      if (by === 'changePct') return (b.dailyChange ?? -Infinity) - (a.dailyChange ?? -Infinity);
      if (by === 'shariahStatus') return (b.isIslamic ? 0 : 1) - (a.isIslamic ? 0 : 1);
      return (a.displayName || a.nameAr || a.code).localeCompare(b.displayName || b.nameAr || b.code, 'ar');
    });
  }

  get listingConfig(): MzListingConfig {
    const count = this.favCount;
    const sFav = this.stockFavCount;
    const fFav = this.fundFavCount;

    const tabs = [
      { id: 'all', label: 'الكل', count: count },
      { id: 'stocks', label: 'الأسهم', count: sFav },
      { id: 'funds', label: 'الصناديق', count: fFav }
    ];

    let cards: any[] = [];
    let visibleCount = 0;

    const stockCards = this.visibleStocks.map((s) => stockToCard(s));
    const fundCards = this.visibleFunds.map((f) => fundToCard(f));

    if (this.activeTab === 'stocks') {
      cards = stockCards;
      visibleCount = stockCards.length;
    } else if (this.activeTab === 'funds') {
      cards = fundCards;
      visibleCount = fundCards.length;
    } else {
      cards = [...stockCards, ...fundCards];
      visibleCount = cards.length;
    }

    const countLabel = fFav > 0 && sFav > 0
      ? `${sFav} سهم • ${fFav} صندوق`
      : fFav > 0
        ? `${fFav} صندوق`
        : `${count} سهم`;

    return {
      header: {
        badge: 'قائمتك الخاصة',
        count: countLabel,
        title: 'المفضلة',
        description: 'الأسهم والصناديق التي حفظتها بنجمة، ببياناتها الحية نفسها: الحكم الشرعي والتغير اليومي.'
      },
      tabs: count > 0 ? tabs : undefined,
      activeTab: this.activeTab,
      filters: count > 0 ? {
        searchValue: this.search,
        searchPlaceholder: 'ابحث في المفضلة بالاسم أو الرمز...',
        controls: [],
        sort: {
          value: this.sortBy,
          options: this.sortOptions,
          label: 'الترتيب'
        }
      } : null,
      results: count > 0 && !this.loading && !this.loadError ? {
        text: `عرض ${visibleCount} من أصل ${count} عنصر في المفضلة`
      } : null,
      cards,
      skeletonCount: Math.max(1, Math.min(count || 4, 8)),
      cardType: this.activeTab === 'funds' ? 'fund' : 'stock',
      loading: this.loading,
      error: !this.loading && this.loadError ? {
        title: 'تعذّر تحميل بيانات المفضلة',
        message: 'تحقق من الاتصال ثم حاول مرة أخرى.'
      } : null,
      empty: count === 0 ? {
        title: 'لا توجد عناصر في المفضلة بعد',
        message: 'اضغط على النجمة في أي سهم أو صندوق لحفظه هنا ومتابعته.'
      } : {
        title: 'لا توجد نتائج مطابقة للبحث في المفضلة',
        message: 'جرّب كلمة بحث مختلفة.'
      }
    };
  }

  onSortChange(val: string): void {
    if (val === 'name' || val === 'changePct' || val === 'shariahStatus') {
      this.sortBy = val;
    }
  }

  reload(): void {
    if (this.favCount === 0) {
      this.allStocks = [];
      this.allFunds = [];
      this.loading = false;
      this.loadError = false;
      return;
    }
    this.loading = true;
    this.loadError = false;

    forkJoin({
      stocks: this.fetchAllStocks().pipe(catchError(() => of([]))),
      funds: this.fetchAllFunds().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ stocks, funds }) => {
        this.allStocks = stocks;
        this.allFunds = funds;
        if (stocks.length > 0) {
          this.favorites.pruneUnknown(stocks.map((s) => s.ticker));
        }
        if (funds.length > 0) {
          this.favorites.pruneUnknownFunds(funds.map((f) => f.code));
        }
        this.loading = false;
      },
      error: () => {
        this.allStocks = [];
        this.allFunds = [];
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  clearAll(): void {
    this.favorites.clear();
    this.confirmingClear = false;
  }

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

  /** Collects every funds page (100/page) so no favorite fund is missed. */
  private fetchAllFunds(): Observable<FundListItemDto[]> {
    return this.api.getFunds({ page: 1, pageSize: 100 } as any).pipe(
      expand((res, index) => {
        const collected = (index + 1) * 100;
        return collected < (res.totalCount || 0)
          ? this.api.getFunds({ page: index + 2, pageSize: 100 } as any)
          : EMPTY;
      }),
      map((res) => res.items || []),
      reduce((acc, items) => acc.concat(items), [] as FundListItemDto[])
    );
  }
}
