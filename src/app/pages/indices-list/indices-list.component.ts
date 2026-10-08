import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, Layers, ShieldCheck, TrendingUp, Printer } from 'lucide-angular';
import { EMPTY, Observable, expand, forkJoin, map, reduce } from 'rxjs';
import { navigateQueryParams } from '../../utils/navigation-utils';
import { ApiService } from '../../services/api.service';
import { ConstituentItemDto, IndexSummaryDto, MarketSnapshotDto } from '../../models/api.models';
import { indexAccentFor, indexIconFor, indexShowsAggregates, isFeaturedIndex } from '../../models/market-icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ViewSwitcherComponent, type EntityView } from '../../components/view-switcher/view-switcher.component';
import { KpiStripComponent, type KpiData } from '../../components/kpi-strip/kpi-strip.component';
import { FilterChipsComponent, type ChipOption } from '../../components/filter-chips/filter-chips.component';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';
import { EntityCardComponent, type EntityStat } from '../../components/entity-card/entity-card.component';
import { EntityTableComponent, type EntityTableColumn, type EntityTableRow } from '../../components/entity-table/entity-table.component';
import { EntityHeatmapComponent, type HeatTileData } from '../../components/entity-heatmap/entity-heatmap.component';
import { LoadingSkeletonsComponent } from '../../components/loading-skeletons/loading-skeletons.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';

type IndexSort = 'compliantCount' | 'compliance' | 'performance' | 'name';
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
}

@Component({
  selector: 'app-indices-list',
  standalone: true,
  imports: [
    CommonModule, LucideAngularModule, PageHeaderComponent, ViewSwitcherComponent,
    KpiStripComponent, FilterChipsComponent, SectionHeaderComponent, EntityCardComponent,
    EntityTableComponent, EntityHeatmapComponent, LoadingSkeletonsComponent, EmptyStateComponent
  ],
  template: `
    <div class="entity-page">
      <app-page-header
        [crumbs]="headerCrumbs"
        pill="المؤشرات الرسمية"
        title="المؤشرات الرسمية للبورصة المصرية"
        description="تعرّف على مكونات كل مؤشر معتمد، وتابع أوزان الأسهم داخله وتقييماتها الشرعية والعادلة.">
        <ng-container toolbar>
          <app-view-switcher [view]="view" (viewChange)="setView($event)"></app-view-switcher>
          <button type="button" class="btn btn-outline btn-sm" (click)="printReport()">
            <lucide-icon [img]="PrintIcon" size="15"></lucide-icon> تقرير PDF
          </button>
        </ng-container>
      </app-page-header>

      <app-kpi-strip [kpis]="kpiList" [loading]="loading || statsLoading"></app-kpi-strip>

      <app-filter-chips
        *ngIf="!loading && !loadError"
        [chips]="chipOptions"
        [activeId]="chip"
        (selected)="setChip($event)">
      </app-filter-chips>

      <app-section-header
        *ngIf="!loading && !loadError"
        [lead]="indices.length + ' مؤشراً رسمياً في قاعدة البيانات'"
        [sessionDate]="sessionLabel"
        [sourceNote]="sourceNote">
      </app-section-header>

      <app-loading-skeletons *ngIf="(loading || statsLoading) && !loadError" variant="card" [count]="6"></app-loading-skeletons>

      <app-empty-state
        *ngIf="!loading && loadError"
        title="تعذّر تحميل المؤشرات"
        message="تحقق من الاتصال ثم حاول مرة أخرى."
        actionLabel="إعادة المحاولة"
        (action)="load()">
      </app-empty-state>

      <app-empty-state
        *ngIf="!loading && !loadError && !indices.length"
        title="لا توجد مؤشرات مسجّلة حتى الآن"
        message="تتم إضافة المؤشرات تلقائياً عند رفع كشوف البورصة الرسمية.">
      </app-empty-state>

      <!-- Grid view -->
      <div class="entity-grid" *ngIf="!loading && !loadError && indices.length && view === 'grid' && !statsLoading">
        <app-entity-card
          *ngFor="let idx of displayedIndices; let i = index; trackBy: trackIndex"
          [itemIndex]="i"
          [title]="idx.nameAr"
          [subtitle]="idx.nameEn"
          [icon]="getIndexIcon(idx.code)"
          [accent]="accentFor(idx.code).accent"
          [tint]="accentFor(idx.code).tint"
          [ink]="accentFor(idx.code).ink"
          [pill]="idx.constituentsCount + ' سهم مكوّن'"
          [stats]="cardStats(idx)"
          [footerText]="footerFor(idx)"
          [link]="linkFor(idx)"
          [ribbon]="isFeatured(idx.code) ? 'المؤشر الشرعي الرسمي' : null"
          [featured]="isFeatured(idx.code)">
        </app-entity-card>
      </div>

      <app-entity-table
        *ngIf="!loading && !loadError && indices.length && view === 'table' && !statsLoading"
        [columns]="tableColumns"
        [rows]="tableRows"
        [sortKey]="tableSortKey"
        [sortDir]="tableSortDir"
        (sortChange)="setTableSort($event)"
        ariaLabel="جدول المؤشرات الرسمية">
      </app-entity-table>

      <app-entity-heatmap
        *ngIf="!loading && !loadError && indices.length && view === 'heatmap' && !statsLoading"
        [tiles]="heatTiles">
      </app-entity-heatmap>
    </div>
  `
})
export class IndicesListComponent implements OnInit {
  readonly PrintIcon = Printer;

  readonly headerCrumbs = [{ label: 'الرئيسية', link: ['/'] }];

  indices: IndexSummaryDto[] = [];
  displayedIndices: IndexSummaryDto[] = [];
  tableRows: EntityTableRow[] = [];
  heatTiles: HeatTileData[] = [];
  kpiList: KpiData[] = [];
  loading = true;
  loadError = false;

  view: EntityView = 'grid';
  chip = 'all';
  sortKey: IndexSort = 'compliantCount';
  tableSortKey = 'compliance';
  tableSortDir: 'asc' | 'desc' = 'desc';
  private printView: EntityView | null = null;

  /**
   * Per-index stats computed ONCE from the constituents endpoints (cached):
   * compliant/total counts, compliance rate and mean daily change — the same
   * verdict/change fields the lists render, so numbers match everywhere.
   */
  statsLoading = true;
  private indexStats = new Map<string, IndexStats>();


  /**
   * Official published quotes (Mubasher), cached once. Official values win
   * wherever present; computed aggregates are the fallback — never the
   * reverse. Empty when the backend never ran a successful fetch.
   */
  private snapshots: MarketSnapshotDto[] = [];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const v = params['view'];
      this.view = v === 'table' || v === 'heatmap' ? v : 'grid';
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.api.getIndices().subscribe({
      next: (data) => {
        this.indices = data || [];
        this.loading = false;
        this.refreshDerived();
        this.loadIndexStats();
        this.loadSnapshots();
      },
      error: () => {
        this.indices = [];
        this.loading = false;
        this.loadError = true;
        this.statsLoading = false;
      }
    });
  }


  /** Official quotes, cached once per page load; silent fallback when absent. */
  private loadSnapshots(): void {
    this.api.getMarketSnapshots().subscribe({
      next: (rows) => {
        this.snapshots = rows || [];
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
  }

  printReport(): void {
    window.print();
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
    this.sortKey = chip === 'all' ? 'compliantCount' : chip;
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
  private refreshDerived(): void {
    this.chipOptions = [
      { id: 'all', label: `كل المؤشرات (${this.indices.length})` },
      { id: 'compliance', label: 'الأعلى توافقاً' },
      { id: 'performance', label: 'الأفضل أداءً اليوم' },
      { id: 'name', label: 'أبجدي' }
    ];
    this.displayedIndices = this.sortIndices([...this.indices], this.sortKey);
    this.tableRows = this.sortTable([...this.indices]).map((idx) => this.toTableRow(idx));
    this.heatTiles = this.heatTilesFor([...this.indices]);
    this.kpiList = this.buildKpis();
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

  private sortIndices(list: IndexSummaryDto[], key: IndexSort): IndexSummaryDto[] {
    switch (key) {
      case 'name':
        return list.sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
      case 'performance': {
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

  /** Heat tiles skip umbrella entries (no tile at all). */
  private heatTilesFor(list: IndexSummaryDto[]): HeatTileData[] {
    return list.filter((idx) => indexShowsAggregates(idx.code)).map((idx) => this.toHeatTile(idx));
  }

  private toHeatTile(idx: IndexSummaryDto): HeatTileData {
    const change = this.changeOf(idx);
    return {
      id: idx.code,
      title: idx.nameAr,
      valueText: change !== null ? `${this.perfArrow(change)} ${this.formatSignedPct(change)}` : null,
      grow: 1,
      color: this.heatColor(change),
      ink: this.heatInk(change),
      link: this.linkFor(idx),
      tooltip: `${idx.nameAr} — ${idx.constituentsCount} سهم`
    };
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
          const row: IndexStats = { total: 0, compliant: 0, changeSum: 0, changeN: 0, weightedSum: 0, weightedDen: 0, tickers: new Set<string>() };
          for (const it of items) {
            row.total++;
            if (it.ticker) row.tickers.add(it.ticker);
            if (this.isCompliantStatus(it.shariahStatus)) row.compliant++;
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
      return [
        { label: 'معدل التوافق', value: null },
        { label: 'الأداء اليومي', value: null }
      ];
    }
    const rate = this.rateOf(idx);
    const change = this.changeOf(idx);
    return [
      rate !== null
        ? { label: 'معدل التوافق', value: `${Math.round(rate)}% متوافق` }
        : { label: 'معدل التوافق', value: null },
      change !== null
        ? { label: 'الأداء اليومي', value: `${this.perfArrow(change)} ${this.formatSignedPct(change)}`, tone: this.perfTone(change) }
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
}
