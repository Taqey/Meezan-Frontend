import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, Layers, ShieldCheck, Coins, Printer } from 'lucide-angular';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { navigateQueryParams } from '../../utils/navigation-utils';
import { ApiService } from '../../services/api.service';
import { MarketSnapshotDto, SectorSummaryDto, StockListItemDto } from '../../models/api.models';
import { sectorAccentFor, sectorIconFor } from '../../models/market-icons';
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

type CardSort = 'compliantCount' | 'name' | 'performance' | 'compliance' | 'pe';
type Chip = 'all' | 'compliance' | 'performance' | 'pe' | 'name';

@Component({
  selector: 'app-sectors-list',
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
        pill="تصنيف قطاعي متوافق مع الشريعة"
        title="القطاعات الاقتصادية"
        description="تصفّح الأسهم المتوافقة شرعاً مرتبةً حسب قطاعها الاقتصادي. اختر قطاعاً لعرض أسهمه وتقييماتهم الشرعية والعادلة.">
        <ng-container toolbar>
          <app-view-switcher [view]="view" (viewChange)="setView($event)"></app-view-switcher>
          <button type="button" class="btn btn-outline btn-sm" (click)="printReport()">
            <lucide-icon [img]="PrintIcon" size="15"></lucide-icon> تقرير PDF
          </button>
        </ng-container>
      </app-page-header>

      <app-kpi-strip [kpis]="kpiList" [loading]="loading || dataPending"></app-kpi-strip>

      <app-filter-chips
        *ngIf="!loading && !loadError"
        [chips]="chipOptions"
        [activeId]="chip"
        (selected)="setChip($event)">
      </app-filter-chips>

      <app-section-header
        *ngIf="!loading && !loadError"
        [lead]="sectors.length + ' قطاعاً بأسهم مصنّفة في قاعدة البيانات'"
        [sessionDate]="sessionLabel"
        [sourceNote]="sourceNote">
      </app-section-header>

      <app-loading-skeletons *ngIf="loading" variant="card" [count]="6"></app-loading-skeletons>

      <app-empty-state
        *ngIf="!loading && loadError"
        title="تعذّر تحميل القطاعات"
        message="تحقق من الاتصال ثم حاول مرة أخرى."
        actionLabel="إعادة المحاولة"
        (action)="load()">
      </app-empty-state>

      <app-empty-state
        *ngIf="!loading && !loadError && !sectors.length"
        [icon]="LayersIcon"
        title="لا توجد قطاعات مسجّلة حتى الآن"
        message="يتم استخراج القطاعات تلقائياً عند رفع كشوف المؤشرات من البورصة المصرية.">
      </app-empty-state>

      <!-- Grid view (waits for both data passes: skeletons, never "—") -->
      <div class="entity-grid" *ngIf="!loading && !loadError && sectors.length && view === 'grid' && !dataPending">
        <app-entity-card
          *ngFor="let s of displayedSectors; let i = index; trackBy: trackSector"
          [itemIndex]="i"
          [title]="s.nameAr"
          [subtitle]="s.nameEn"
          [icon]="getSectorIcon(s.nameEn)"
          [accent]="accentFor(s.nameEn).accent"
          [tint]="accentFor(s.nameEn).tint"
          [ink]="accentFor(s.nameEn).ink"
          [pill]="s.stocksCount + ' سهم مصنّف'"
          [stats]="cardStats(s)"
          [footerText]="'استعرض الـ ' + s.stocksCount + ' سهم'"
          [link]="['/indices/Sectoral-Indices', s.id]">
        </app-entity-card>
      </div>

      <!-- Waiting skeletons for any view while data settles -->
      <app-loading-skeletons
        *ngIf="!loading && !loadError && sectors.length && dataPending"
        variant="card"
        [count]="6">
      </app-loading-skeletons>

      <app-entity-table
        *ngIf="!loading && !loadError && sectors.length && view === 'table' && !dataPending"
        [columns]="tableColumns"
        [rows]="tableRows"
        [sortKey]="tableSortKey"
        [sortDir]="tableSortDir"
        (sortChange)="setTableSort($event)"
        ariaLabel="جدول القطاعات الاقتصادية">
      </app-entity-table>

      <app-entity-heatmap
        *ngIf="!loading && !loadError && sectors.length && view === 'heatmap' && !dataPending"
        [tiles]="heatTiles"
        [sizeNote]="hasAnyMarketCap ? 'حجم المربع يعكس القيمة السوقية للقطاع' : null">
      </app-entity-heatmap>
    </div>
  `
})
export class SectorsListComponent implements OnInit {
  readonly PrintIcon = Printer;
  readonly LayersIcon = Layers;

  readonly headerCrumbs = [
    { label: 'الرئيسية', link: ['/'] },
    { label: 'البورصة المصرية', link: ['/indices'] }
  ];

  sectors: SectorSummaryDto[] = [];
  displayedSectors: SectorSummaryDto[] = [];
  tableColumns: EntityTableColumn[] = [];
  tableRows: EntityTableRow[] = [];
  heatTiles: HeatTileData[] = [];
  kpiList: KpiData[] = [];
  loading = true;
  loadError = false;

  view: EntityView = 'grid';
  chip = 'all';
  sortKey: CardSort = 'compliantCount';
  tableSortKey = 'compliance';
  tableSortDir: 'asc' | 'desc' = 'desc';
  private printView: EntityView | null = null;

  /**
   * Client-side sector stats computed ONCE from the stocks endpoint (cached in
   * marketStats) — the same endpoint/fields the stocks pages render, so the
   * numbers match everywhere by construction. Used until the backend ships
   * the matching aggregate fields (market-cap stays backend-only).
   */
  marketLoading = true;
  private marketStats = new Map<string, { total: number; compliant: number; changeSum: number; changeN: number; peSum: number; peN: number }>();
  lastSessionDate: string | null = null;
  snapshotsLoading = true;

  /** Cards/table/heatmap render only after both data passes settle — never a flashing "—". */
  get dataPending(): boolean {
    return this.marketLoading || this.snapshotsLoading;
  }

  /**
   * Official published quotes (Mubasher), cached once. Official sector %
   * wins wherever present; the computed mean is the fallback.
   */
  private snapshots: MarketSnapshotDto[] = [];

  private officialForSector(id: number): MarketSnapshotDto | null {
    const key = String(id);
    return this.snapshots.find((s) => s.kind === 'Sector' && s.code === key) ?? null;
  }

  /** Session label: official source date wins, support-resistance fallback. */
  get sessionLabel(): string | null {
    const dates = this.snapshots
      .filter((s) => s.kind === 'Sector' && s.sourceDateText)
      .map((s) => s.sourceDateText as string);
    if (dates.length) {
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
      if (best) return best;
    }
    return this.lastSessionDate;
  }

  get sourceNote(): string | null {
    if (this.snapshots.some((s) => s.kind === 'Sector')) return 'المصدر: مباشر';
    if (this.marketLoading) return null;
    return this.sectors.length ? 'حساب تقديري من بيانات الأسهم' : null;
  }

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // The subscription fires immediately with the current params; later
    // emissions only switch the view (data loads once here, again on retry).
    this.route.queryParams.subscribe((params) => {
      const v = params['view'];
      this.view = v === 'table' || v === 'heatmap' ? v : 'grid';
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.api.getSectors().subscribe({
      next: (data) => {
        this.sectors = data || [];
        this.loading = false;
        this.refreshDerived();
        this.loadMarketStats();
        this.loadSnapshots();
      },
      error: () => {
        this.sectors = [];
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  /** Official quotes, cached once per page load; silent fallback when absent. */
  private loadSnapshots(): void {
    this.snapshotsLoading = true;
    this.api.getMarketSnapshots().subscribe({
      next: (rows) => {
        this.snapshots = rows || [];
        this.snapshotsLoading = false;
        this.refreshDerived();
      },
      error: () => {
        this.snapshots = [];
        this.snapshotsLoading = false;
        this.refreshDerived();
      }
    });
  }

  // ── Icons / accents (shared configs, stable English-name keys) ──────
  getSectorIcon(nameEn?: string | null) {
    return sectorIconFor(nameEn);
  }

  accentFor(nameEn?: string | null) {
    return sectorAccentFor(nameEn);
  }

  trackSector(_index: number, s: SectorSummaryDto): number {
    return s.id;
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
    // The color-dependent heatmap prints poorly — print the sortable table.
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

  // ── Chips (All, Highest compliance, Best performance, Lowest P/E, A-Z) ──
  chipOptions: ChipOption[] = [];

  setChip(id: string): void {
    const chip: Chip =
      id === 'compliance' || id === 'performance' || id === 'pe' || id === 'name' ? id : 'all';
    this.chip = chip;
    this.sortKey = chip === 'all' ? 'compliantCount' : chip;
    this.refreshDerived();
  }

  // ── Table sorting ───────────────────────────────────────────────────
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
  private enrichedSectors: SectorSummaryDto[] = [];

  private refreshDerived(): void {
    const enriched = this.sectors.map((s) => this.withMarketStats(s));
    this.enrichedSectors = enriched;
    this.chipOptions = [
      { id: 'all', label: `كل القطاعات (${this.sectors.length})` },
      { id: 'compliance', label: 'الأعلى توافقاً' },
      { id: 'performance', label: 'الأفضل أداءً اليوم' },
      { id: 'pe', label: 'الأقل مكرر ربحية' },
      { id: 'name', label: 'أبجدي' }
    ];
    this.displayedSectors = this.sortSectors(enriched, this.sortKey);
    this.tableColumns = this.buildTableColumns();
    this.tableRows = this.sortTable(enriched).map((s) => this.toTableRow(s));
    const heatBase = [...enriched].sort((a, b) => (b.marketCapTotal ?? -1) - (a.marketCapTotal ?? -1));
    this.heatTiles = heatBase.map((s) => ({
      id: s.id,
      title: s.nameAr,
      valueText: s.averageChangePct !== null && s.averageChangePct !== undefined
        ? `${this.perfArrow(s.averageChangePct)} ${this.formatSignedPct(s.averageChangePct)}`
        : null,
      grow: this.heatGrow(s),
      color: this.heatColor(s.averageChangePct),
      ink: this.heatInk(s.averageChangePct),
      link: ['/indices/Sectoral-Indices', s.id],
      tooltip: this.heatLabel(s)
    }));
    this.kpiList = this.buildKpis();
  }

  private buildTableColumns(): EntityTableColumn[] {
    const cols: EntityTableColumn[] = [
      { key: 'name', label: 'القطاع', sortable: true },
      { key: 'stocks', label: 'الأسهم', sortable: true },
      { key: 'compliance', label: 'التوافق', sortable: true },
      { key: 'performance', label: 'الأداء اليومي', sortable: true }
    ];
    if (this.hasAnyMarketCap) cols.push({ key: 'cap', label: 'القيمة السوقية', sortable: true });
    cols.push({ key: 'pe', label: 'مكرر الربحية', sortable: true });
    return cols;
  }

  /**
   * Overlays the cached stocks-endpoint aggregates onto one sector row.
   * Totals come from the same visible population the sector page lists, so
   * the pill, the rate and the KPI sums always agree with the stocks pages.
   * Market-cap fields stay backend-driven (absent until deployed).
   */
  private withMarketStats(s: SectorSummaryDto): SectorSummaryDto {
    const row = this.marketStats.get((s.nameAr || '').trim());
    if (!row || row.total === 0) return s;
    // Daily performance is the official scraped figure, directly — no
    // computed fallback. Missing official figure means "—", never a number.
    const official = this.officialForSector(s.id)?.changePct;
    return {
      ...s,
      stocksCount: row.total,
      compliantStocksCount: row.compliant,
      complianceRatePct: Math.round((100 * row.compliant) / row.total * 10) / 10,
      averageChangePct: official !== null && official !== undefined ? Number(official) : null,
      averagePeRatio: row.peN > 0 ? row.peSum / row.peN : null
    };
  }

  private sortSectors(list: SectorSummaryDto[], key: CardSort): SectorSummaryDto[] {
    switch (key) {
      case 'name':
        return list.sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
      case 'performance':
        return list.sort((a, b) => (b.averageChangePct ?? -Infinity) - (a.averageChangePct ?? -Infinity));
      case 'compliance':
        return list.sort((a, b) => (b.complianceRatePct ?? -1) - (a.complianceRatePct ?? -1));
      case 'pe':
        // Lowest P/E first; null or non-positive values sink to the end.
        return list.sort((a, b) => {
          const pa = a.averagePeRatio !== null && a.averagePeRatio !== undefined && a.averagePeRatio > 0
            ? a.averagePeRatio : Infinity;
          const pb = b.averagePeRatio !== null && b.averagePeRatio !== undefined && b.averagePeRatio > 0
            ? b.averagePeRatio : Infinity;
          return pa - pb;
        });
      case 'compliantCount':
      default:
        return list.sort((a, b) => (b.compliantStocksCount ?? b.stocksCount) - (a.compliantStocksCount ?? a.stocksCount));
    }
  }

  private sortTable(list: SectorSummaryDto[]): SectorSummaryDto[] {
    const dir = this.tableSortDir === 'desc' ? 1 : -1;
    const key = this.tableSortKey;
    return list.sort((a, b) => {
      switch (key) {
        case 'name':
          return dir * (a.nameAr || '').localeCompare(b.nameAr || '', 'ar');
        case 'stocks':
          return dir * (a.stocksCount - b.stocksCount);
        case 'compliance':
          return dir * ((a.complianceRatePct ?? -1) - (b.complianceRatePct ?? -1));
        case 'performance':
          return dir * ((a.averageChangePct ?? -Infinity) - (b.averageChangePct ?? -Infinity));
        case 'cap':
          return dir * ((a.marketCapTotal ?? -1) - (b.marketCapTotal ?? -1));
        case 'pe': {
          const pa = a.averagePeRatio !== null && a.averagePeRatio !== undefined && a.averagePeRatio > 0
            ? a.averagePeRatio : (dir > 0 ? Infinity : -Infinity);
          const pb = b.averagePeRatio !== null && b.averagePeRatio !== undefined && b.averagePeRatio > 0
            ? b.averagePeRatio : (dir > 0 ? Infinity : -Infinity);
          return dir * (pa - pb);
        }
        default:
          return 0;
      }
    });
  }

  private toTableRow(s: SectorSummaryDto): EntityTableRow {
    const perf = s.averageChangePct !== null && s.averageChangePct !== undefined
      ? { text: `${this.perfArrow(s.averageChangePct)} ${this.formatSignedPct(s.averageChangePct)}`, tone: this.perfTone(s.averageChangePct) }
      : { text: '—', tone: 'muted' as const };
    const row: EntityTableRow = {
      id: s.id,
      cells: {
        name: { text: s.nameAr, sub: s.nameEn, link: ['/indices/Sectoral-Indices', s.id] },
        stocks: { text: String(s.stocksCount), ltr: true },
        compliance: s.complianceRatePct !== null && s.complianceRatePct !== undefined
          ? { text: `${Math.round(Number(s.complianceRatePct))}%`, ltr: true }
          : { text: '—', tone: 'muted' },
        performance: perf,
        pe: s.averagePeRatio !== null && s.averagePeRatio !== undefined
          ? { text: Number(s.averagePeRatio).toFixed(1), ltr: true }
          : { text: '—', tone: 'muted' }
      }
    };
    if (this.hasAnyMarketCap) {
      row.cells['cap'] = { text: this.formatMarketCapShort(s.marketCapTotal) };
    }
    return row;
  }

  private perfTone(value: number): 'positive' | 'negative' | 'muted' {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'muted';
  }

  // ── Card stats ──────────────────────────────────────────────────────
  cardStats(s: SectorSummaryDto): EntityStat[] {
    const compliance: EntityStat = s.complianceRatePct !== null && s.complianceRatePct !== undefined
      ? { label: 'معدل التوافق', value: `${Math.round(Number(s.complianceRatePct))}% متوافق` }
      : { label: 'معدل التوافق', value: null };
    const perf: EntityStat = s.averageChangePct !== null && s.averageChangePct !== undefined
      ? {
          label: 'الأداء اليومي',
          value: `${this.perfArrow(s.averageChangePct)} ${this.formatSignedPct(s.averageChangePct)}`,
          tone: this.perfTone(s.averageChangePct)
        }
      : { label: 'الأداء اليومي', value: null };
    return [compliance, perf];
  }

  // ── KPIs ────────────────────────────────────────────────────────────
  private buildKpis(): KpiData[] {
    const list: KpiData[] = [
      { icon: Layers, value: String(this.sectors.length), label: 'قطاعاً مدرجاً' },
      {
        icon: ShieldCheck,
        value: String(this.totalCompliant),
        sub: `من ${this.totalStocks}`,
        label: 'سهم متوافق شرعاً'
      }
    ];
    if (this.totalCompliantCap !== null) {
      list.push({ icon: Coins, value: this.formatMarketCap(this.totalCompliantCap), label: 'القيمة السوقية للمتوافق' });
    }
    return list;
  }

  get totalStocks(): number {
    return this.enrichedSectors.reduce((n, s) => n + s.stocksCount, 0);
  }

  get totalCompliant(): number {
    return this.enrichedSectors.reduce((n, s) => n + (s.compliantStocksCount ?? 0), 0);
  }

  get totalCompliantCap(): number | null {
    let sum = 0;
    let any = false;
    for (const s of this.enrichedSectors) {
      if (s.compliantMarketCapTotal !== null && s.compliantMarketCapTotal !== undefined) {
        sum += Number(s.compliantMarketCapTotal);
        any = true;
      }
    }
    return any ? sum : null;
  }

  get hasAnyMarketCap(): boolean {
    return this.enrichedSectors.some((s) => s.marketCapTotal !== null && s.marketCapTotal !== undefined);
  }

  // ── Market stats (cached single fetch over the stocks endpoint) ─────
  /**
   * Single cached fetch of the whole stocks list (100/page, then filter in
   * memory): no N+1 requests, no flicker. Enriches each sector with
   * compliant/total counts, compliance rate, mean daily change and mean P/E.
   * Also resolves the latest session date from one support-resistance read.
   */
  private loadMarketStats(): void {
    if (!this.sectors.length) {
      this.marketLoading = false;
      return;
    }
    this.marketLoading = true;
    this.fetchAllStocks().subscribe({
      next: (stocks) => {
        const stats = new Map<string, { total: number; compliant: number; changeSum: number; changeN: number; peSum: number; peN: number }>();
        for (const s of stocks) {
          const key = (s.sectorNameAr || '').trim();
          if (!key) continue;
          let row = stats.get(key);
          if (!row) {
            row = { total: 0, compliant: 0, changeSum: 0, changeN: 0, peSum: 0, peN: 0 };
            stats.set(key, row);
          }
          row.total++;
          if (this.isCompliantStatus(s.shariahStatus)) row.compliant++;
          if (s.changePct !== null && s.changePct !== undefined) {
            row.changeSum += Number(s.changePct);
            row.changeN++;
          }
          if (s.peRatio !== null && s.peRatio !== undefined && Number(s.peRatio) > 0) {
            row.peSum += Number(s.peRatio);
            row.peN++;
          }
        }
        this.marketStats = stats;
        this.marketLoading = false;
        this.refreshDerived();
        this.resolveSessionDate(stocks);
      },
      error: () => {
        // Stocks fetch failed: keep backend counts, hide computed stats.
        this.marketStats = new Map();
        this.marketLoading = false;
        this.refreshDerived();
      }
    });
  }

  /** The exact verdict field the stocks list and stock detail page display. */
  private isCompliantStatus(status?: string | null): boolean {
    const s = (status || '').toLowerCase().replace(/[-_ ]/g, '');
    return s === 'compliant' || s === 'متوافق';
  }

  /** Collects every stocks page (100/page) in one cached pass. */
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

  /** Latest trading session date from a single support-resistance read. */
  private resolveSessionDate(stocks: StockListItemDto[]): void {
    const sample = stocks.find((s) => s.changePct !== null && s.changePct !== undefined);
    if (!sample) return;
    this.api.getSupportResistance(sample.ticker).subscribe({
      next: (sr) => {
        this.lastSessionDate = sr?.fetchedAt ? String(sr.fetchedAt).slice(0, 10) : null;
      },
      error: () => {
        this.lastSessionDate = null;
      }
    });
  }

  // ── Formatting helpers ──────────────────────────────────────────────
  formatMarketCap(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    const v = Number(value);
    if (!isFinite(v)) return '—';
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)} مليار جنيه`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)} مليون جنيه`;
    return `${Math.round(v).toLocaleString('en-US')} جنيه`;
  }

  formatMarketCapShort(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    const v = Number(value);
    if (!isFinite(v)) return '—';
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)} مليار`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)} مليون`;
    return `${Math.round(v).toLocaleString('en-US')}`;
  }

  formatSignedPct(value: number): string {
    const v = Number(value);
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
  }

  perfArrow(value: number): string {
    if (value > 0) return '▲';
    if (value < 0) return '▼';
    return '•';
  }

  heatLabel(s: SectorSummaryDto): string {
    const parts = [`${s.stocksCount} سهم`, this.formatMarketCapShort(s.marketCapTotal) + ' جنيه'];
    if (s.averageChangePct !== null && s.averageChangePct !== undefined) {
      parts.push(this.formatSignedPct(Number(s.averageChangePct)));
    }
    return parts.join(' — ');
  }

  /** Flex share ∝ market-cap share (equal shares when caps are missing). */
  heatGrow(s: SectorSummaryDto): number {
    const total = this.enrichedSectors.reduce((n, x) => n + (Number(x.marketCapTotal) || 0), 0);
    const cap = Number(s.marketCapTotal) || 0;
    if (!total || !cap) return 1;
    return Math.max(1, Math.round((cap / total) * this.enrichedSectors.length * 2));
  }

  /** Green → red by daily performance; gray when unknown. */
  heatColor(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'var(--muted)';
    const t = Math.max(-1, Math.min(1, Number(value) / 5));
    if (t > 0) return `rgba(8, 127, 91, ${(0.25 + 0.65 * t).toFixed(2)})`;
    if (t < 0) return `rgba(200, 68, 61, ${(0.25 + 0.65 * -t).toFixed(2)})`;
    return 'var(--muted)';
  }

  /** White text on saturated tiles, ink text on pale/gray ones. */
  heatInk(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'var(--muted-foreground)';
    return Math.abs(Number(value)) >= 2.5 ? '#fff' : 'var(--ink)';
  }
}
