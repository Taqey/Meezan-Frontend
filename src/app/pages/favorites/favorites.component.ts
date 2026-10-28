import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Star, Trash2 } from 'lucide-angular';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { FavoritesService } from '../../services/favorites.service';
import { StockListItemDto } from '../../models/api.models';
import {
  MzListingPageComponent,
  MzButtonComponent,
  MzBadgeComponent,
  stockToCard,
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

  get listingConfig(): MzListingConfig {
    const count = this.favCount;
    const visible = this.visibleStocks;
    const cards = visible.map((s) => stockToCard(s));

    return {
      header: {
        badge: 'قائمتك الخاصة',
        count: `${count} سهم`,
        title: 'المفضلة',
        description: 'الأسهم التي حفظتها بنجمة، ببياناتها الحية نفسها: الحكم الشرعي ونسبة التغير.'
      },
      filters: count > 0 ? {
        searchValue: this.search,
        searchPlaceholder: 'ابحث في المفضلة باسم السهم أو رمزه...',
        controls: [],
        sort: {
          value: this.sortBy,
          options: this.sortOptions,
          label: 'الترتيب'
        }
      } : null,
      results: count > 0 && !this.loading && !this.loadError ? {
        text: `عرض ${visible.length} من أصل ${count} سهم في المفضلة`
      } : null,
      cards,
      skeletonCount: Math.max(1, Math.min(count || 4, 8)),
      cardType: 'stock',
      loading: this.loading,
      error: !this.loading && this.loadError ? {
        title: 'تعذّر تحميل بيانات الأسهم',
        message: 'تحقق من الاتصال ثم حاول مرة أخرى.'
      } : null,
      empty: count === 0 ? {
        title: 'لا توجد أسهم في المفضلة بعد',
        message: 'اضغط على النجمة في أي سهم لحفظه هنا ومتابعته.'
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
