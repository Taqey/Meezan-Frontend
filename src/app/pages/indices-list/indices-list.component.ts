import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, Layers, ShieldCheck, TrendingUp, Printer } from 'lucide-angular';
import { EMPTY, Observable, expand, forkJoin, map, reduce } from 'rxjs';
import { navigateQueryParams } from '../../utils/navigation-utils';
import { ApiService } from '../../services/api.service';
import { ConstituentItemDto, IndexSummaryDto, MarketSnapshotDto } from '../../models/api.models';
import { indexAccentFor, indexIconFor, indexShowsAggregates, isFeaturedIndex, indexShortNameFor, indexFullNameFor } from '../../models/market-icons';
import { MzListingPageComponent, type MzListingConfig } from '../../components/ui/ui-listing-page';
import { MzButtonComponent, MzSelectComponent, type MzOption } from '../../components/ui/ui-small';
import type { MzListingCardData } from '../../components/ui/ui-listing';
import { ViewSwitcherComponent, type EntityView } from '../../components/view-switcher/view-switcher.component';
import { type KpiData } from '../../components/kpi-strip/kpi-strip.component';
import { type ChipOption } from '../../components/filter-chips/filter-chips.component';
import { type EntityStat } from '../../components/entity-card/entity-card.component';
import { FormsModule } from '@angular/forms';
import { SessionCacheService } from '../../services/session-cache.service';
import { EntityTableComponent, type EntityTableColumn, type EntityTableRow } from '../../components/entity-table/entity-table.component';
import { TreemapComponent, type TreemapItem } from '../../components/treemap/treemap.component';

type IndexSort = 'compliantCount' | 'compliance' | 'performance' | 'name' | 'constituents' | 'change';
type Chip = 'all' | 'compliance' | 'performance' | 'name';

interface IndexStats {
  total: number;
  compliant: number;
  changeSum: number;
  changeN: number;
  /** Index-weighted mean (only when the index publishes weights). */
  weightedSum: number;
  weightedDen: number;
  /** Set of unique ticker codes in this index (for de-duplication). */
  tickers: Set<string>;
  /** Sum of market caps of constituents. */
  marketCapSum: number;
}

@Component({
  selector: 'app-indices-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MzListingPageComponent, MzButtonComponent, MzSelectComponent, ViewSwitcherComponent, EntityTableComponent, TreemapComponent],
    template: `
    <mz-listing-page
      [config]="config"
      [customView]="view !== 'grid'"
      (tabChange)="setChip($event)"
      (searchChange)="onSearchInput($event)"
      (controlChange)="onControlChange($event)"
      (sortChange)="onSortChangeSelect($event)"
      (advancedClick)="advancedOpen = !advancedOpen; rebuild()"
      (retry)="load(true)">
      <ng-container actions>
        <app-view-switcher [view]="view" (viewChange)="setView($event)"></app-view-switcher>
        <mz-button [icon]="PrintIcon" [loading]="printing" (clicked)="printReport()">تقرير PDF</mz-button>
      </ng-container>
      <ng-container view>
        <app-entity-table
          *ngIf="indices.length && view === 'table' && !statsLoading"
          [columns]="tableColumns" [rows]="tableRows" [sortKey]="tableSortKey" [sortDir]="tableSortDir"
          (sortChange)="setTableSort($event)" ariaLabel="جدول المؤشرات الرسمية">
        </app-entity-table>
        <app-treemap
          *ngIf="indices.length && view === 'heatmap' && !statsLoading"
          [items]="treemapItems"
          sizeNote="حجم كل مربع يمثل إجمالي القيمة السوقية لأسهم المؤشر">
        </app-treemap>
      </ng-container>
      <div advanced class="mz-adv-grid">
        <label class="mz-slicer">
          <span class="mz-slicer-head"><span>الحد الأدنى لعدد الأسهم المكونة</span></span>
          <mz-select
            [options]="minConstituentsOptions"
            [(ngModel)]="minConstituents"
            (valueChange)="minConstituents = $event; refreshDerived()"
            ariaLabel="الحد الأدنى لعدد الأسهم">
          </mz-select>
        </label>
      </div>
    </mz-listing-page>
  `
})
export class IndicesListComponent implements OnInit, OnDestroy {
  readonly PrintIcon = Printer;

  readonly headerCrumbs = [{ label: 'الرئيسية', link: ['/'] }];

  indices: IndexSummaryDto[] = [];
  displayedIndices: IndexSummaryDto[] = [];
  tableRows: EntityTableRow[] = [];
  treemapItems: TreemapItem[] = [];
  kpiList: KpiData[] = [];
  loading = true;
  loadError = false;

  view: EntityView = 'grid';
  chip = 'all';
  search = '';
  shariahFilter = '';
  sortField = 'change';
  sortDir: 'asc' | 'desc' = 'desc';
  advancedOpen = false;
  minConstituents = 0;
  readonly minConstituentsOptions: MzOption[] = [
    { value: 0, label: 'الكل' },
    { value: 30, label: '30 سهم فأكثر' },
    { value: 70, label: '70 سهم فأكثر' },
    { value: 100, label: '100 سهم فأكثر' }
  ];

  sortKey: IndexSort = 'compliantCount';
  tableSortKey = 'compliance';
  tableSortDir: 'asc' | 'desc' = 'desc';
  private printView: EntityView | null = null;

  statsLoading = true;
  private indexStats = new Map<string, IndexStats>();
  private snapshots: MarketSnapshotDto[] = [];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cache: SessionCacheService
  ) {}

  ngOnInit(): void {
    const saved = this.cache.getUiState<any>('indices-list');
    if (saved) {
      this.search = saved.search || '';
      this.shariahFilter = saved.shariahFilter || '';
      this.chip = saved.chip || 'all';
      this.sortKey = (saved.sortKey || 'compliantCount') as IndexSort;
      this.sortField = saved.sortField || 'change';
      this.sortDir = saved.sortDir || 'desc';
      this.minConstituents = saved.minConstituents || 0;
      this.view = saved.view || 'grid';
    }

    this.route.queryParams.subscribe((params) => {
      const v = params['view'];
      if (v === 'table' || v === 'heatmap') {
        this.view = v;
      }
      if (params['search'] !== undefined) this.search = params['search'];
      if (params['shariah'] !== undefined) this.shariahFilter = params['shariah'];
    });
    this.load();
  }

  ngOnDestroy(): void {
    this.cache.saveScroll('indices-list', window.scrollX, window.scrollY);
    this.cache.saveUiState('indices-list', {
      search: this.search,
      shariahFilter: this.shariahFilter,
      sortField: this.sortField,
      sortDir: this.sortDir,
      minConstituents: this.minConstituents,
      chip: this.chip,
      view: this.view
    });
  }

  onSearchInput(val: string): void {
    this.search = val;
    this.refreshDerived();
  }

  onControlChange(e: { id: string; value?: string; values?: string[] }): void {
    if (e.id === 'shariah') {
      this.shariahFilter = e.value || (e.values ? e.values[0] : '') || '';
      this.refreshDerived();
    }
  }

  onSortChangeSelect(val: string): void {
    this.sortField = val;
    this.refreshDerived();
  }

  load(force = false): void {
    const cachedData = this.cache.get<IndexSummaryDto[]>('indices_data');
    const cachedSnaps = this.cache.get<MarketSnapshotDto[]>('indices_snapshots');
    const cachedStats = this.cache.get<Map<string, IndexStats>>('indices_stats');

    if (!force && cachedData) {
      this.indices = cachedData.data;
      if (cachedSnaps) this.snapshots = cachedSnaps.data;
      if (cachedStats) this.indexStats = cachedStats.data;
      this.loading = false;
      this.statsLoading = !cachedStats;
      this.refreshDerived();
      this.cache.restoreScroll('indices-list');

      // If not stale, do not refetch; if stale, refresh silently in background
      if (!this.cache.isStale('indices_data')) {
        return;
      }
    }

    if (!this.indices.length) {
      this.loading = true;
      this.rebuild();
    }
    this.loadError = false;

    this.api.getIndices().subscribe({
      next: (data) => {
        this.indices = data || [];
        this.cache.set('indices_data', this.indices);
        this.loading = false;
        this.refreshDerived();
        this.loadIndexStats();
        this.loadSnapshots();
        if (cachedData) {
          this.cache.restoreScroll('indices-list');
        }
      },
      error: () => {
        if (!this.indices.length) {
          this.indices = [];
          this.loading = false;
          this.loadError = true;
          this.rebuild();
          this.statsLoading = false;
        }
      }
    });
  }

  /** Official quotes, cached once per page load; silent fallback when absent. */
  private loadSnapshots(): void {
    this.api.getMarketSnapshots().subscribe({
      next: (rows) => {
        this.snapshots = rows || [];
        this.cache.set('indices_snapshots', this.snapshots);
        this.refreshDerived();
      },
      error: () => {
        this.snapshots = [];
      }
    });
  }

  // ── Icons / accents / featured (shared configs) ─────────────────────
  getIndexIcon(code: string) {
    return indexIconFor(code);
  }

  accentFor(code: string) {
    return indexAccentFor(code);
  }

  isFeatured(code: string): boolean {
    return isFeaturedIndex(code);
  }

  trackIndex(_index: number, idx: IndexSummaryDto): string {
    return idx.code;
  }

  linkFor(idx: IndexSummaryDto): string[] {
    return indexShowsAggregates(idx.code) ? ['/indices', idx.code] : ['/sectors'];
  }

  footerFor(idx: IndexSummaryDto): string {
    return indexShowsAggregates(idx.code)
      ? `استعرض الـ ${idx.constituentsCount} سهم`
      : 'استعرض القطاعات';
  }

  /** Umbrella entries (Sectoral-Indices) show no aggregated stats anywhere. */
  showsAggregates(code: string): boolean {
    return indexShowsAggregates(code);
  }

  // ── View / print ────────────────────────────────────────────────────
  setView(view: EntityView): void {
    if (view === this.view) return;
    this.view = view;
    navigateQueryParams(
      this.router,
      this.route,
      { view: view === 'grid' ? null : view },
      'merge'
    );
    this.rebuild();
  }

  printing = false;

  printReport(): void {
    this.printing = true;
    setTimeout(() => {
      window.print();
      this.printing = false;
    }, 320);
  }

  @HostListener('window:beforeprint')
  onBeforePrint(): void {
    this.printView = this.view;
    this.view = 'table';
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    if (this.printView) {
      this.view = this.printView;
      this.printView = null;
    }
  }

  // ── Chips (All, Highest compliance, Best performance, A-Z) ───────────
  chipOptions: ChipOption[] = [];

  setChip(id: string): void {
    const chip: Chip = id === 'compliance' || id === 'performance' || id === 'name' ? id : 'all';
    this.chip = chip;
    this.sortField = chip === 'all' ? 'change' : chip === 'performance' ? 'change' : chip;
    this.refreshDerived();
  }

  // ── Table sorting ───────────────────────────────────────────────────
  readonly tableColumns: EntityTableColumn[] = [
    { key: 'name', label: 'المؤشر', sortable: true },
    { key: 'stocks', label: 'الأسهم', sortable: true },
    { key: 'compliance', label: 'التوافق', sortable: true },
    { key: 'performance', label: 'الأداء اليومي', sortable: true }
  ];

  setTableSort(key: string): void {
    if (this.tableSortKey === key) {
      this.tableSortDir = this.tableSortDir === 'desc' ? 'asc' : 'desc';
    } else {
      this.tableSortKey = key;
      this.tableSortDir = key === 'name' ? 'asc' : 'desc';
    }
    this.refreshDerived();
  }

  // ── Derived view models (plain fields: no getter churn, no replays) ───
  refreshDerived(): void {
    this.chipOptions = [
      { id: 'all', label: `كل المؤشرات (${this.indices.length})` },
      { id: 'compliance', label: 'الأعلى توافقاً' },
      { id: 'performance', label: 'الأفضل أداءً اليوم' },
      { id: 'name', label: 'أبجدي' }
    ];

    let list = [...this.indices];

    if (this.search && this.search.trim()) {
      const q = this.search.trim().toLowerCase();
      list = list.filter((idx) =>
        (idx.nameAr && idx.nameAr.toLowerCase().includes(q)) ||
        (idx.nameEn && idx.nameEn.toLowerCase().includes(q)) ||
        (idx.code && idx.code.toLowerCase().includes(q))
      );
    }

    if (this.shariahFilter === 'compliant_100') {
      list = list.filter((idx) => {
        const r = this.rateOf(idx);
        return r !== null && r >= 100;
      });
    } else if (this.shariahFilter === 'compliant_70') {
      list = list.filter((idx) => {
        const r = this.rateOf(idx);
        return r !== null && r >= 70;
      });
    }

    if (this.minConstituents > 0) {
      list = list.filter((idx) => idx.constituentsCount >= this.minConstituents);
    }

    list = this.sortIndices(list, this.sortField);

    this.displayedIndices = list;
    this.tableRows = this.sortTable([...list]).map((idx) => this.toTableRow(idx));
    this.treemapItems = this.treemapItemsFor([...list]);
    this.kpiList = this.buildKpis();
    this.rebuild();
  }

  private statsFor(code: string): IndexStats | null {
    return this.indexStats.get((code || '').trim()) ?? null;
  }

  private officialFor(code: string): MarketSnapshotDto | null {
    const key = (code || '').trim();
    return this.snapshots.find((s) => s.kind === 'Index' && s.code === key) ?? null;
  }

  /** Latest trading-session label from official snapshots, if any. */
  get sessionLabel(): string | null {
    const dates = this.snapshots
      .filter((s) => s.kind === 'Index' && s.sourceDateText)
      .map((s) => s.sourceDateText as string);
    if (!dates.length) return null;
    const counts = new Map<string, number>();
    for (const d of dates) counts.set(d, (counts.get(d) || 0) + 1);
    let best: string | null = null;
    let bestN = 0;
    counts.forEach((n, d) => {
      if (n > bestN) {
        bestN = n;
        best = d;
      }
    });
    return best;
  }

  get sourceNote(): string | null {
    if (this.snapshots.some((s) => s.kind === 'Index')) return 'المصدر: مباشر';
    if (this.statsLoading) return null;
    return this.indices.length ? 'حساب تقديري من بيانات الأسهم' : null;
  }

  private rateOf(idx: IndexSummaryDto): number | null {
    const st = this.statsFor(idx.code);
    if (!st || st.total === 0) return null;
    return Math.round((100 * st.compliant) / st.total * 10) / 10;
  }

  private changeOf(idx: IndexSummaryDto): number | null {
    const official = this.officialFor(idx.code)?.changePct;
    if (official !== null && official !== undefined) return Number(official);
    // Weighted fallback: official index weight when published, else simple mean.
    const st = this.statsFor(idx.code);
    if (!st) return null;
    if (st.weightedDen > 0) return st.weightedSum / st.weightedDen;
    if (st.changeN === 0) return null;
    return st.changeSum / st.changeN;
  }

  private compliantOf(idx: IndexSummaryDto): number {
    return this.statsFor(idx.code)?.compliant ?? 0;
  }

  private sortIndices(list: IndexSummaryDto[], key: string): IndexSummaryDto[] {
    switch (key) {
      case 'name':
        return list.sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
      case 'performance':
      case 'change': {
        const perf = (x: IndexSummaryDto): number => {
          const c = this.changeOf(x);
          return c === null ? -Infinity : c;
        };
        return list.sort((a, b) => perf(b) - perf(a));
      }
      case 'compliance': {
        const rate = (x: IndexSummaryDto): number => {
          const r = this.rateOf(x);
          return r === null ? -1 : r;
        };
        return list.sort((a, b) => rate(b) - rate(a));
      }
      case 'constituents':
        return list.sort((a, b) => b.constituentsCount - a.constituentsCount);
      case 'compliantCount':
      default:
        return list.sort((a, b) => this.compliantOf(b) - this.compliantOf(a));
    }
  }

  private sortTable(list: IndexSummaryDto[]): IndexSummaryDto[] {
    const dir = this.tableSortDir === 'desc' ? 1 : -1;
    const key = this.tableSortKey;
    const num = (x: IndexSummaryDto | null, f: (x: IndexSummaryDto) => number | null, fallback: number): number => {
      if (!x) return fallback;
      const v = f(x);
      return v === null ? fallback : v;
    };
    return list.sort((a, b) => {
      switch (key) {
        case 'name':
          return dir * (a.nameAr || '').localeCompare(b.nameAr || '', 'ar');
        case 'stocks':
          return dir * (a.constituentsCount - b.constituentsCount);
        case 'compliance':
          return dir * (num(a, (x) => this.rateOf(x), -1) - num(b, (x) => this.rateOf(x), -1));
        case 'performance':
          return dir * (num(a, (x) => this.changeOf(x), -Infinity) - num(b, (x) => this.changeOf(x), -Infinity));
        default:
          return 0;
      }
    });
  }

  private toTableRow(idx: IndexSummaryDto): EntityTableRow {
    // Umbrella rows keep only identity cells; aggregates show "—".
    if (!indexShowsAggregates(idx.code)) {
      return {
        id: idx.code,
        cells: {
          name: { text: idx.nameAr, sub: idx.nameEn, link: this.linkFor(idx) },
          stocks: { text: String(idx.constituentsCount), ltr: true },
          compliance: { text: '—', tone: 'muted' },
          performance: { text: '—', tone: 'muted' }
        }
      };
    }
    const rate = this.rateOf(idx);
    const change = this.changeOf(idx);
    return {
      id: idx.code,
      cells: {
        name: { text: idx.nameAr, sub: idx.nameEn, link: this.linkFor(idx) },
        stocks: { text: String(idx.constituentsCount), ltr: true },
        compliance: rate !== null
          ? { text: `${Math.round(rate)}%`, ltr: true }
          : { text: '—', tone: 'muted' },
        performance: change !== null
          ? { text: `${this.perfArrow(change)} ${this.formatSignedPct(change)}`, tone: this.perfTone(change) }
          : { text: '—', tone: 'muted' }
      }
    };
  }

  /** TradingView-style treemap tiles: tile area = constituent market cap (or constituent count / weight as proportional fallback), excludes umbrella Sectoral-Indices */
  private treemapItemsFor(list: IndexSummaryDto[]): TreemapItem[] {
    return list
      .filter((idx) => indexShowsAggregates(idx.code))
      .map((idx) => {
        const change = this.changeOf(idx);
        const stats = this.statsFor(idx.code);
        const snap = this.officialFor(idx.code);
        // Use marketCapSum if available, otherwise constituent count * 1000, fallback to 10
        const cap = stats?.marketCapSum && stats.marketCapSum > 0
          ? stats.marketCapSum
          : (idx.constituentsCount ? idx.constituentsCount * 1000 : 10);
        const shortCode = indexShortNameFor(idx.code);
        const fullName = indexFullNameFor(idx.code);

        let subLabel = '';
        if (snap?.value != null) {
          const ptsVal = Number(snap.value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          const ptsChg = snap.change != null
            ? ` (${snap.change > 0 ? '+' : ''}${Number(snap.change).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })})`
            : '';
          subLabel = `${ptsVal} نقطة${ptsChg}`;
        }

        const capFormatted = stats?.marketCapSum && stats.marketCapSum > 0
          ? `${(stats.marketCapSum / 1_000_000_000).toFixed(1)} مليار ج.م`
          : `${idx.constituentsCount} سهم`;

        const changeFormatted = change !== null ? this.formatSignedPct(change) : '—';
        const pointsFormatted = snap?.value != null
          ? `${Number(snap.value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} نقطة`
          : '—';

        return {
          id: idx.code,
          label: shortCode,
          subLabel: subLabel,
          value: cap,
          changePct: change,
          link: this.linkFor(idx),
          tooltip: `${fullName} (${shortCode})\n${stats?.marketCapSum ? 'القيمة السوقية: ' + capFormatted : 'الأسهم: ' + capFormatted}\nالتغير: ${changeFormatted}\nالنقاط: ${pointsFormatted}`
        };
      });
  }

  // ── KPIs ────────────────────────────────────────────────────────────
  private buildKpis(): KpiData[] {
    // De-duplicate tickers across all indices so a stock in EGX30 and EGX100
    // is counted only once.
    const allTickers = new Set<string>();
    this.indexStats.forEach((row) => row.tickers.forEach((t) => allTickers.add(t)));
    const coveredCount = allTickers.size > 0
      ? allTickers.size
      : this.indices.filter((x) => indexShowsAggregates(x.code))
          .reduce((n, x) => n + (x.constituentsCount || 0), 0);

    const list: KpiData[] = [
      { icon: Layers, value: String(this.indices.length), label: 'مؤشراً رسمياً' },
      {
        icon: ShieldCheck,
        value: String(coveredCount),
        label: 'سهم فريد مغطى بالمؤشرات'
      }
    ];
    const best = this.bestPerformer();
    if (best) {
      list.push({
        icon: TrendingUp,
        value: `${this.perfArrow(best.change)} ${this.formatSignedPct(best.change)}`,
        sub: best.code,
        label: 'أفضل أداء اليوم'
      });
    }
    return list;
  }

  private bestPerformer(): { code: string; change: number } | null {
    let best: { code: string; change: number } | null = null;
    for (const idx of this.indices) {
      if (!indexShowsAggregates(idx.code)) continue;
      const change = this.changeOf(idx);
      if (change === null) continue;
      if (!best || change > best.change) best = { code: idx.code, change };
    }
    return best;
  }

  // ── Per-index stats (one cached pass over the constituents endpoints) ──
  private loadIndexStats(): void {
    if (!this.indices.length) {
      this.statsLoading = false;
      return;
    }
    this.statsLoading = true;
    this.rebuild();
    // Umbrella entries are skipped entirely: nothing is calculated for them.
    const targets = this.indices.filter((idx) => indexShowsAggregates(idx.code));
    if (!targets.length) {
      this.indexStats = new Map();
      this.statsLoading = false;
      this.refreshDerived();
      return;
    }
    const jobs = targets.map((idx) => this.fetchConstituents(idx.code));
    forkJoin(jobs).subscribe({
      next: (results) => {
        const stats = new Map<string, IndexStats>();
        results.forEach((items, i) => {
          const key = (targets[i]?.code || '').trim();
          const row: IndexStats = { total: 0, compliant: 0, changeSum: 0, changeN: 0, weightedSum: 0, weightedDen: 0, tickers: new Set<string>(), marketCapSum: 0 };
          for (const it of items) {
            row.total++;
            if (it.ticker) row.tickers.add(it.ticker);
            if (this.isCompliantStatus(it.shariahStatus)) row.compliant++;
            if (it.marketCap !== null && it.marketCap !== undefined) {
              row.marketCapSum += Number(it.marketCap);
            }
            if (it.changePct !== null && it.changePct !== undefined) {
              const change = Number(it.changePct);
              row.changeSum += change;
              row.changeN++;
              if (it.weight !== null && it.weight !== undefined) {
                row.weightedSum += change * Number(it.weight);
                row.weightedDen += Number(it.weight);
              }
            }
          }
          stats.set(key, row);
        });
        this.indexStats = stats;
        this.cache.set('indices_stats', this.indexStats);
        this.statsLoading = false;
        this.refreshDerived();
      },
      error: () => {
        this.indexStats = new Map();
        this.statsLoading = false;
        this.refreshDerived();
      }
    });
  }

  /** The exact verdict field the lists render. */
  private isCompliantStatus(status?: string | null): boolean {
    const s = (status || '').toLowerCase().replace(/[-_ ]/g, '');
    return s === 'compliant' || s === 'متوافق';
  }

  /** All pages of one index's constituents (100/page). */
  private fetchConstituents(code: string): Observable<ConstituentItemDto[]> {
    return this.api.getIndexConstituents(code, { page: 1, pageSize: 100 }).pipe(
      expand((res, index) => {
        const collected = (index + 1) * 100;
        return collected < (res.totalCount || 0)
          ? this.api.getIndexConstituents(code, { page: index + 2, pageSize: 100 })
          : EMPTY;
      }),
      map((res) => res.items || []),
      reduce((acc, items) => acc.concat(items), [] as ConstituentItemDto[])
    );
  }

  // ── Card stats ──────────────────────────────────────────────────────
  cardStats(idx: IndexSummaryDto): EntityStat[] {
    // Umbrella entries (Sectoral) show the same two stat slots but with null
    // values so the card body keeps the identical height as every other card.
    if (!indexShowsAggregates(idx.code)) {
      return [];
    }
    const rate = this.rateOf(idx);
    const change = this.changeOf(idx);
    const snap = this.officialFor(idx.code);
    let perfLabel = change !== null ? `${this.perfArrow(change)} ${this.formatSignedPct(change)}` : null;
    if (snap?.value != null) {
      const ptsVal = Number(snap.value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
      const ptsChg = snap.change != null
        ? ` (${snap.change > 0 ? '+' : ''}${Number(snap.change).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })})`
        : '';
      perfLabel = `${ptsVal} نقطة · ${perfLabel || ''}${ptsChg}`;
    }
    return [
      rate !== null
        ? { label: 'معدل التوافق', value: `${Math.round(rate)}% متوافق` }
        : { label: 'معدل التوافق', value: null },
      perfLabel !== null
        ? { label: 'الأداء اليومي', value: perfLabel, tone: change !== null ? this.perfTone(change) : undefined }
        : { label: 'الأداء اليومي', value: null }
    ];
  }

  // ── Formatting helpers ──────────────────────────────────────────────
  formatSignedPct(value: number): string {
    const v = Number(value);
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
  }

  perfArrow(value: number): string {
    if (value > 0) return '▲';
    if (value < 0) return '▼';
    return '•';
  }

  private perfTone(value: number): 'positive' | 'negative' | 'muted' {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'muted';
  }

  private heatColor(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'var(--muted)';
    const t = Math.max(-1, Math.min(1, Number(value) / 5));
    if (t > 0) return `rgba(8, 127, 91, ${(0.25 + 0.65 * t).toFixed(2)})`;
    if (t < 0) return `rgba(200, 68, 61, ${(0.25 + 0.65 * -t).toFixed(2)})`;
    return 'var(--muted)';
  }

  private heatInk(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'var(--muted-foreground)';
    return Math.abs(Number(value)) >= 2.5 ? '#fff' : 'var(--ink)';
  }

  /** Single config object for the shared ListingPage. */
  config: MzListingConfig = { header: { badge: '', title: '', description: '' }, cards: [], empty: { title: '', message: '' } };

  rebuild(): void {
    const tabs = (this.chipOptions.length ? this.chipOptions : [
      { id: 'all', label: `كل المؤشرات (${this.indices.length || 8})` },
      { id: 'compliance', label: 'الأعلى توافقاً' },
      { id: 'performance', label: 'الأفضل أداءً اليوم' },
      { id: 'name', label: 'أبجدي' }
    ]).map((c) => ({ id: c.id, label: c.label }));

    this.config = {
      header: {
        badge: 'المؤشرات الرسمية',
        title: 'المؤشرات الرسمية للبورصة المصرية',
        description: 'تعرّف على مكونات كل مؤشر معتمد، وتابع أوزان الأسهم داخله وتقييماتها الشرعية والعادلة.'
      },
      stats: this.kpiList.map((k) => ({ label: k.label, value: k.value, icon: k.icon, chip: k.sub })),
      statsLoading: this.statsLoading,
      statsCount: 3,
      tabs,
      activeTab: this.chip,
      filters: {
        searchValue: this.search,
        searchPlaceholder: 'ابحث باسم المؤشر أو رمزه (مثال: EGX30 أو EGX70)...',
        controls: [
          {
            id: 'shariah',
            kind: 'select',
            label: 'الشرعية',
            value: this.shariahFilter,
            options: [
              { value: '', label: 'الشرعية: الكل' },
              { value: 'compliant_100', label: 'متوافق 100%' },
              { value: 'compliant_70', label: 'متوافق جزئياً (>70%)' }
            ]
          }
        ],
        sort: {
          label: 'ترتيب النتائج',
          value: this.sortField,
          options: [
            { value: 'change', label: 'الترتيب: نسبة التغير (تنازلي)' },
            { value: 'compliance', label: 'الترتيب: نسبة التوافق الشرعي' },
            { value: 'constituents', label: 'الترتيب: عدد الأسهم المكوّنة' },
            { value: 'name', label: 'الترتيب: أبجدي' }
          ]
        },
        advanced: {
          label: 'تصفية متقدمة',
          open: this.advancedOpen,
          count: this.minConstituents > 0 ? 1 : 0
        }
      },
      results: {
        text: this.view === 'heatmap'
          ? `${this.treemapItems.length} مؤشرات معروضة في الخريطة الحرارية`
          : (this.indices.length || 8) + ' مؤشراً رسمياً في قاعدة البيانات',
        note: [this.sessionLabel, this.sourceNote].filter(Boolean).join(' · ') || null
      },
      cards: this.displayedIndices.map((i) => this.toCard(i)),
      skeletonCount: this.indices.length || 8,
      cardType: 'index',
      loading: this.loading && !this.loadError,
      error: !this.loading && this.loadError ? { title: 'تعذّر تحميل المؤشرات', message: 'تحقق من الاتصال ثم حاول مرة أخرى.' } : null,
      empty: { title: 'لا توجد مؤشرات مسجّلة حتى الآن', message: 'تتم إضافة المؤشرات تلقائياً عند رفع كشوف البورصة الرسمية.' }
    };
  }

  private toCard(idx: IndexSummaryDto): MzListingCardData {
    const featured = this.isFeatured(idx.code);
    const shortCode = indexShowsAggregates(idx.code) ? indexShortNameFor(idx.code) : idx.nameAr;
    const fullNames = indexFullNameFor(idx.code);
    return {
      id: idx.code,
      title: shortCode,
      subtitle: indexShowsAggregates(idx.code) ? `${idx.nameAr} • ${idx.nameEn}` : idx.nameEn,
      icon: this.getIndexIcon(idx.code),
      featured,
      badges: [...(featured ? [{ label: 'المؤشر الشرعي الرسمي', tone: 'default' as const }] : []), { label: idx.constituentsCount + ' سهم مكوّن', tone: 'neutral' as const }],
      metrics: this.cardStats(idx).map((st) => ({ label: st.label, value: st.value, tone: st.tone })),
      linkLabel: this.footerFor(idx),
      link: this.linkFor(idx)
    };
  }

}
