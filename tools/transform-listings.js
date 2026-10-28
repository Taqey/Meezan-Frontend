const fs = require('fs');

// 1. Transform SectorsListComponent
let sf = 'src/app/pages/sectors-list/sectors-list.component.ts';
let sc = fs.readFileSync(sf, 'utf8');

sc = sc.replace(/import\s*\{\s*PageHeaderComponent\s*\}\s*from\s*'[^']+';/, `import { MzListingPageComponent, type MzListingConfig } from '../../components/ui/ui-listing-page';\nimport type { MzListingCardData } from '../../components/ui/ui-listing';`);
sc = sc.replace(/import\s*\{\s*KpiStripComponent,\s*type\s*KpiData\s*\}\s*from\s*'[^']+';/, `import { type KpiData } from '../../components/kpi-strip/kpi-strip.component';`);
sc = sc.replace(/import\s*\{\s*FilterChipsComponent,\s*type\s*ChipOption\s*\}\s*from\s*'[^']+';/, `import { type ChipOption } from '../../components/filter-chips/filter-chips.component';`);
sc = sc.replace(/import\s*\{\s*SectionHeaderComponent\s*\}\s*from\s*'[^']+';\r?\n?/, '');
sc = sc.replace(/import\s*\{\s*EntityCardComponent,\s*type\s*EntityStat\s*\}\s*from\s*'[^']+';/, `import { type EntityStat } from '../../components/entity-card/entity-card.component';`);
sc = sc.replace(/import\s*\{\s*LoadingSkeletonsComponent\s*\}\s*from\s*'[^']+';\r?\n?/, '');
sc = sc.replace(/import\s*\{\s*EmptyStateComponent\s*\}\s*from\s*'[^']+';\r?\n?/, '');

sc = sc.replace(/imports:\s*\[[\s\S]*?\](?=,\r?\n\s*template:)/, 'imports: [CommonModule, LucideAngularModule, MzListingPageComponent, ViewSwitcherComponent, EntityTableComponent, EntityHeatmapComponent]');

const sTpl = `  template: \`
    <mz-listing-page [config]="config" [customView]="view !== 'grid'" (tabChange)="setChip($event)" (retry)="load()">
      <ng-container actions>
        <app-view-switcher [view]="view" (viewChange)="setView($event)"></app-view-switcher>
        <button type="button" class="mz-btn" (click)="printReport()">
          <lucide-icon [img]="PrintIcon" size="15"></lucide-icon> تقرير PDF
        </button>
      </ng-container>
      <ng-container view>
        <app-entity-table
          *ngIf="sectors.length && view === 'table' && !dataPending"
          [columns]="tableColumns" [rows]="tableRows" [sortKey]="tableSortKey" [sortDir]="tableSortDir"
          (sortChange)="setTableSort($event)" ariaLabel="جدول القطاعات الاقتصادية">
        </app-entity-table>
        <app-entity-heatmap
          *ngIf="sectors.length && view === 'heatmap' && !dataPending"
          [tiles]="heatTiles"
          [sizeNote]="hasAnyMarketCap ? 'حجم المربع يعكس القيمة السوقية للقطاع' : null">
        </app-entity-heatmap>
      </ng-container>
    </mz-listing-page>
  \``;
sc = sc.replace(/template:\s*`[\s\S]*?`\r?\n\}\)/, sTpl + '\n})');

const sExtra = `
  /** Single config object for the shared ListingPage. */
  config: MzListingConfig = { header: { badge: '', title: '', description: '' }, cards: [], empty: { title: '', message: '' } };

  rebuild(): void {
    this.config = {
      header: {
        badge: 'تصنيف قطاعي متوافق مع الشريعة',
        title: 'القطاعات الاقتصادية',
        description: 'تصفّح الأسهم المتوافقة شرعاً مرتبةً حسب قطاعها الاقتصادي. اختر قطاعاً لعرض أسهمه وتقييماتهم الشرعية والعادلة.'
      },
      stats: this.kpiList.map((k) => ({ label: k.label, value: k.value, icon: k.icon, chip: k.sub })),
      statsLoading: this.loading || this.dataPending,
      tabs: this.loading || this.loadError ? null : this.chipOptions.map((c) => ({ id: c.id, label: c.label })),
      activeTab: this.chip,
      results: this.loading || this.loadError ? null : {
        text: this.sectors.length + ' قطاعاً بأسهم مصنّفة في قاعدة البيانات',
        note: [this.sessionLabel, this.sourceNote].filter(Boolean).join(' · ') || null
      },
      cards: this.dataPending ? [] : this.displayedSectors.map((s) => this.toCard(s)),
      loading: this.loading || (this.sectors.length > 0 && this.dataPending),
      error: !this.loading && this.loadError ? { title: 'تعذّر تحميل القطاعات', message: 'تحقق من الاتصال ثم حاول مرة أخرى.' } : null,
      empty: { title: 'لا توجد قطاعات مسجّلة حتى الآن', message: 'يتم استخراج القطاعات تلقائياً عند رفع كشوف المؤشرات من البورصة المصرية.' }
    };
  }

  private toCard(s: SectorSummaryDto): MzListingCardData {
    return {
      id: s.id,
      title: s.nameAr,
      subtitle: s.nameEn,
      icon: this.getSectorIcon(s.nameEn),
      badges: [{ label: s.stocksCount + ' سهم مصنّف', tone: 'neutral' }],
      metrics: this.cardStats(s).map((st) => ({ label: st.label, value: st.value, tone: st.tone })),
      linkLabel: 'استعرض الـ ' + s.stocksCount + ' سهم',
      link: ['/indices/Sectoral-Indices', s.id]
    };
  }
`;

sc = sc.replace(/(this\.kpiList\s*=\s*this\.buildKpis\(\);)/, '$1\n    this.rebuild();');
sc = sc.replace(/(load\(\):\s*void\s*\{[\s\S]*?this\.loading\s*=\s*true;\s*this\.loadError\s*=\s*false;)/, '$1\n    this.rebuild();');
sc = sc.replace(/(this\.sectors\s*=\s*\[\];\s*this\.loading\s*=\s*false;\s*this\.loadError\s*=\s*true;)/, '$1\n        this.rebuild();');
sc = sc.replace(/(this\.snapshotsLoading\s*=\s*true;)/, '$1\n    this.rebuild();');

const lastBraceS = sc.lastIndexOf('}');
sc = sc.slice(0, lastBraceS) + sExtra + '\n}\n';

fs.writeFileSync(sf, sc, 'utf8');
console.log('Sectors transformed successfully');

// 2. Transform IndicesListComponent
let inf = 'src/app/pages/indices-list/indices-list.component.ts';
let inc = fs.readFileSync(inf, 'utf8');

inc = inc.replace(/import\s*\{\s*PageHeaderComponent\s*\}\s*from\s*'[^']+';/, `import { MzListingPageComponent, type MzListingConfig } from '../../components/ui/ui-listing-page';\nimport type { MzListingCardData } from '../../components/ui/ui-listing';`);
inc = inc.replace(/import\s*\{\s*KpiStripComponent,\s*type\s*KpiData\s*\}\s*from\s*'[^']+';/, `import { type KpiData } from '../../components/kpi-strip/kpi-strip.component';`);
inc = inc.replace(/import\s*\{\s*FilterChipsComponent,\s*type\s*ChipOption\s*\}\s*from\s*'[^']+';/, `import { type ChipOption } from '../../components/filter-chips/filter-chips.component';`);
inc = inc.replace(/import\s*\{\s*SectionHeaderComponent\s*\}\s*from\s*'[^']+';\r?\n?/, '');
inc = inc.replace(/import\s*\{\s*EntityCardComponent,\s*type\s*EntityStat\s*\}\s*from\s*'[^']+';/, `import { type EntityStat } from '../../components/entity-card/entity-card.component';`);
inc = inc.replace(/import\s*\{\s*LoadingSkeletonsComponent\s*\}\s*from\s*'[^']+';\r?\n?/, '');
inc = inc.replace(/import\s*\{\s*EmptyStateComponent\s*\}\s*from\s*'[^']+';\r?\n?/, '');

inc = inc.replace(/imports:\s*\[[\s\S]*?\](?=,\r?\n\s*template:)/, 'imports: [CommonModule, LucideAngularModule, MzListingPageComponent, ViewSwitcherComponent, EntityTableComponent, EntityHeatmapComponent]');

const inTpl = `  template: \`
    <mz-listing-page [config]="config" [customView]="view !== 'grid'" (tabChange)="setChip($event)" (retry)="load()">
      <ng-container actions>
        <app-view-switcher [view]="view" (viewChange)="setView($event)"></app-view-switcher>
        <button type="button" class="mz-btn" (click)="printReport()">
          <lucide-icon [img]="PrintIcon" size="15"></lucide-icon> تقرير PDF
        </button>
      </ng-container>
      <ng-container view>
        <app-entity-table
          *ngIf="indices.length && view === 'table' && !statsLoading"
          [columns]="tableColumns" [rows]="tableRows" [sortKey]="tableSortKey" [sortDir]="tableSortDir"
          (sortChange)="setTableSort($event)" ariaLabel="جدول المؤشرات الرسمية">
        </app-entity-table>
        <app-entity-heatmap *ngIf="indices.length && view === 'heatmap' && !statsLoading" [tiles]="heatTiles"></app-entity-heatmap>
      </ng-container>
    </mz-listing-page>
  \``;
inc = inc.replace(/template:\s*`[\s\S]*?`\r?\n\}\)/, inTpl + '\n})');

const inExtra = `
  /** Single config object for the shared ListingPage. */
  config: MzListingConfig = { header: { badge: '', title: '', description: '' }, cards: [], empty: { title: '', message: '' } };

  rebuild(): void {
    const busy = this.loading || this.statsLoading;
    this.config = {
      header: {
        badge: 'المؤشرات الرسمية',
        title: 'المؤشرات الرسمية للبورصة المصرية',
        description: 'تعرّف على مكونات كل مؤشر معتمد، وتابع أوزان الأسهم داخله وتقييماتها الشرعية والعادلة.'
      },
      stats: this.kpiList.map((k) => ({ label: k.label, value: k.value, icon: k.icon, chip: k.sub })),
      statsLoading: busy,
      tabs: this.loading || this.loadError ? null : this.chipOptions.map((c) => ({ id: c.id, label: c.label })),
      activeTab: this.chip,
      results: this.loading || this.loadError ? null : {
        text: this.indices.length + ' مؤشراً رسمياً في قاعدة البيانات',
        note: [this.sessionLabel, this.sourceNote].filter(Boolean).join(' · ') || null
      },
      cards: busy ? [] : this.displayedIndices.map((i) => this.toCard(i)),
      loading: busy && !this.loadError,
      error: !this.loading && this.loadError ? { title: 'تعذّر تحميل المؤشرات', message: 'تحقق من الاتصال ثم حاول مرة أخرى.' } : null,
      empty: { title: 'لا توجد مؤشرات مسجّلة حتى الآن', message: 'تتم إضافة المؤشرات تلقائياً عند رفع كشوف البورصة الرسمية.' }
    };
  }

  private toCard(idx: IndexSummaryDto): MzListingCardData {
    const featured = this.isFeatured(idx.code);
    return {
      id: idx.code,
      title: idx.nameAr,
      subtitle: idx.nameEn,
      icon: this.getIndexIcon(idx.code),
      featured,
      badges: [...(featured ? [{ label: 'المؤشر الشرعي الرسمي', tone: 'default' as const }] : []), { label: idx.constituentsCount + ' سهم مكوّن', tone: 'neutral' as const }],
      metrics: this.cardStats(idx).map((st) => ({ label: st.label, value: st.value, tone: st.tone })),
      linkLabel: this.footerFor(idx),
      link: this.linkFor(idx)
    };
  }
`;

inc = inc.replace(/(this\.kpiList\s*=\s*this\.buildKpis\(\);)/, '$1\n    this.rebuild();');
inc = inc.replace(/(load\(\):\s*void\s*\{[\s\S]*?this\.loading\s*=\s*true;\s*this\.loadError\s*=\s*false;)/, '$1\n    this.rebuild();');
inc = inc.replace(/(this\.indices\s*=\s*\[\];\s*this\.loading\s*=\s*false;\s*this\.loadError\s*=\s*true;)/, '$1\n        this.rebuild();');
inc = inc.replace(/(this\.statsLoading\s*=\s*true;)/g, '$1\n    this.rebuild();');

const lastBraceI = inc.lastIndexOf('}');
inc = inc.slice(0, lastBraceI) + inExtra + '\n}\n';

fs.writeFileSync(inf, inc, 'utf8');
console.log('Indices transformed successfully');
