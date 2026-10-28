const fs = require('fs');

let ff = 'src/app/pages/funds-list/funds-list.component.ts';
let fc = fs.readFileSync(ff, 'utf8');

fc = fc.replace(/import\s*\{\s*PageHeaderComponent\s*\}\s*from\s*'[^']+';/, `import { MzListingPageComponent, type MzListingConfig } from '../../components/ui/ui-listing-page';\nimport type { MzListingCardData } from '../../components/ui/ui-listing';`);
fc = fc.replace(/import\s*\{\s*SectionHeaderComponent\s*\}\s*from\s*'[^']+';\r?\n?/, '');
fc = fc.replace(/import\s*\{\s*LoadingSkeletonsComponent\s*\}\s*from\s*'[^']+';\r?\n?/, '');
fc = fc.replace(/import\s*\{\s*EmptyStateComponent\s*\}\s*from\s*'[^']+';\r?\n?/, '');
fc = fc.replace(/import\s*\{\s*EntityCardComponent,\s*EntityStat\s*\}\s*from\s*'[^']+';/, `import { type EntityStat } from '../../components/entity-card/entity-card.component';`);

fc = fc.replace(/imports:\s*\[[\s\S]*?\](?=,\r?\n\s*template:)/, 'imports: [CommonModule, FormsModule, LucideAngularModule, ClassificationCascadeComponent, MzListingPageComponent]');

const fTpl = `  template: \`
    <mz-listing-page
      [config]="config"
      (tabChange)="setChip($event)"
      (searchChange)="onSearchInput($event)"
      (sortChange)="onSortChangeSelect($event)"
      (advancedClick)="toggleAdvanced(); rebuild()"
      (pageChange)="goToPage($event)"
      (retry)="loadFunds()">

      <div resultsExtra class="mz-active-filters" *ngIf="hasActiveFilters">
        <span class="mz-badge pill neutral" *ngIf="filter.search">البحث: {{ filter.search }} <button type="button" class="mz-x" (click)="removeSearchFilter()" aria-label="حذف بحث">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="activeNodeName">التصنيف: {{ activeNodeName }} <button type="button" class="mz-x" (click)="removeNodeFilter()" aria-label="حذف فلتر التصنيف">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="activeManagerName">المدير: {{ activeManagerName }} <button type="button" class="mz-x" (click)="removeManagerFilter()" aria-label="حذف فلتر المدير">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="filter.riskLevel">المخاطر: {{ filter.riskLevel === 'low' ? 'منخفضة' : filter.riskLevel === 'medium' ? 'متوسطة' : 'عالية' }} <button type="button" class="mz-x" (click)="removeRiskFilter()" aria-label="حذف فلتر المخاطر">×</button></span>
        <span class="mz-badge pill neutral" *ngIf="filter.isIslamic !== undefined">الحكم: {{ filter.isIslamic ? 'متوافق شرعاً' : 'غير متوافق' }} <button type="button" class="mz-x" (click)="removeShariaFilter()" aria-label="حذف فلتر التوافق الشرعي">×</button></span>
        <button type="button" class="mz-btn" style="padding:2px 8px;font-size:11px" (click)="resetFilters()">مسح الفلاتر</button>
      </div>

      <div advanced class="mz-adv-grid">
        <div style="grid-column: 1 / -1">
          <app-classification-cascade
            [tree]="classTree"
            [path]="classPath"
            rootLabel="نوع الصندوق"
            allLabel="كل الأنواع"
            (pathChange)="onClassPathChange($event)">
          </app-classification-cascade>
        </div>
        <div class="mz-slicer">
          <span class="mz-slicer-head"><span>الشركة المسؤولة (مدير الأصول)</span></span>
          <select class="mz-select" [ngModel]="filter.assetManagerId" (ngModelChange)="onManagerChange($event)" aria-label="الشركة المسؤولة عن الصندوق">
            <option [ngValue]="undefined">كل الشركات والمديرين</option>
            <option *ngFor="let mgr of assetManagers" [ngValue]="mgr.id">
              {{ mgr.nameAr }} ({{ mgr.fundCount }})
            </option>
          </select>
        </div>
        <div class="mz-slicer">
          <span class="mz-slicer-head"><span>مستوى المخاطر</span></span>
          <select class="mz-select" [ngModel]="filter.riskLevel" (ngModelChange)="onRiskChange($event)" aria-label="مستوى المخاطر">
            <option [ngValue]="undefined">كل المستويات</option>
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
          </select>
        </div>
        <div class="mz-slicer">
          <span class="mz-slicer-head"><span>الحكم الشرعي (المصدر)</span></span>
          <select class="mz-select" [ngModel]="filter.isIslamic" (ngModelChange)="onShariaChange($event)" aria-label="الحكم الشرعي">
            <option [ngValue]="undefined">الكل</option>
            <option [ngValue]="true">متوافق شرعياً</option>
            <option [ngValue]="false">غير متوافق</option>
          </select>
        </div>
      </div>

      <div footer class="mz-source-note" style="margin-top:24px">
        المصدر: <a href="https://snduk.com" target="_blank" rel="noopener" style="color:var(--mz-primary);text-decoration:underline">SNDUK</a> |
        آخر تحديث: {{ lastSyncedAt ? (lastSyncedAt | date:'yyyy-MM-dd HH:mm') : '—' }} |
        <span>إخلاء المسؤولية: البيانات للأغراض المعلوماتية فقط ولا تُعد نصيحة استثمارية.</span>
      </div>
    </mz-listing-page>
  \``;

fc = fc.replace(/template:\s*`[\s\S]*?`,\r?\n\s*styles:\s*\[[\s\S]*?\]\r?\n\}\)/, fTpl + '\n})');

const fExtra = `
  config: MzListingConfig = { header: { badge: '', title: '', description: '' }, cards: [], empty: { title: '', message: '' } };

  onSearchInput(val: string): void {
    this.searchText = val;
    this.searchChanged.next(val);
  }

  onSortChangeSelect(val: string): void {
    const [field, dir] = val.split(':');
    this.filter.sortBy = field as any;
    this.filter.sortDir = dir as any;
    this.onSortChange();
  }

  rebuild(): void {
    const busy = this.initialLoading || (this.loading && !this.initialLoading);
    this.config = {
      header: {
        badge: 'الصناديق الاستثمارية',
        count: this.totalCount + ' صندوقاً استثمارياً',
        title: 'الصناديق الاستثمارية المصرية',
        description: 'استعرض وحلل جميع الصناديق الاستثمارية في السوق المصري مع فلاتر متقدمة للتصنيف، حجم الأصول، مستويات المخاطر، العوائد والرسوم، والرقابة الشرعية.'
      },
      stats: this.kpiList.map((k) => ({ label: k.label, value: k.value, icon: k.icon, chip: k.sub })),
      statsLoading: this.statsLoading,
      tabs: this.quickChips.map((c) => ({ id: c.id, label: c.label })),
      activeTab: this.activeChip,
      filters: {
        searchValue: this.searchText,
        searchPlaceholder: 'ابحث بالاسم أو الرمز (مثال: PHF)...',
        controls: [],
        sort: {
          label: 'ترتيب الصناديق',
          value: (this.filter.sortBy || 'return1y') + ':' + (this.filter.sortDir || 'desc'),
          options: [
            { value: 'return1y:desc', label: 'العائد السنوي (1Y) (تنازلي)' },
            { value: 'return1y:asc', label: 'العائد السنوي (1Y) (تصاعدي)' },
            { value: 'return6m:desc', label: 'العائد (6M) (تنازلي)' },
            { value: 'return3m:desc', label: 'العائد (3M) (تنازلي)' },
            { value: 'return1m:desc', label: 'العائد (1M) (تنازلي)' },
            { value: 'aum:desc', label: 'الأصول (AUM) (الأعلى)' },
            { value: 'totalScore:desc', label: 'الدرجة الكلية (الأعلى)' },
            { value: 'managementFee:asc', label: 'الرسوم السنوية (الأقل)' },
            { value: 'name:asc', label: 'الاسم أبجدياً' }
          ]
        },
        advanced: {
          label: 'فلاتر متقدمة',
          open: this.advancedOpen,
          count: this.activeFiltersCount
        }
      },
      results: {
        text: this.totalCount + ' نتيجة مطابقة (الصفحة ' + this.currentPage + ' من ' + (this.totalPages || 1) + ')',
        note: this.sourceNote
      },
      cards: this.funds.map((f) => this.toCard(f)),
      loading: busy,
      error: !this.initialLoading && this.loadError ? { title: 'تعذّر تحميل الصناديق', message: 'تحقق من الاتصال ثم حاول مرة أخرى.' } : null,
      empty: { title: 'لا توجد صناديق مطابقة للفلاتر المختارة', message: 'جرّب تعديل خيارات البحث أو إزالة أحد الفلاتر لتوسيع نطاق النتائج.' },
      page: this.currentPage,
      totalPages: this.totalPages
    };
  }

  private toCard(fund: FundListItemDto): MzListingCardData {
    const rawType = normFundType(fund.type);
    const badges: { label: string; tone?: any }[] = [];
    if (fund.isIslamic) {
      badges.push({ label: 'متوافق شرعاً', tone: 'default' });
    }
    const catBadge = this.getClassificationBadge(fund);
    if (catBadge) {
      badges.push({ label: catBadge, tone: 'neutral' });
    }
    return {
      id: fund.code,
      title: fund.nameAr,
      subtitle: fund.nameEn,
      icon: this.getFundIcon(rawType),
      logoUrl: fundLogoUrl(fund.localLogoPath, fund.logoUrl),
      featured: fund.isFeatured,
      badges,
      metrics: this.cardStats(fund).map((st) => ({ label: st.label, value: st.value, tone: st.tone })),
      linkLabel: 'استعراض الصندوق',
      link: ['/funds', fund.slug]
    };
  }
`;

fc = fc.replace(/(this\.kpiList\s*=\s*\[[\s\S]*?\];)/, '$1\n        this.rebuild();');
fc = fc.replace(/(this\.updateLastSyncedAt\(\);)/, '$1\n            this.rebuild();');
fc = fc.replace(/(this\.initialLoading\s*=\s*false;\s*this\.loadError\s*=\s*true;)/g, '$1\n            this.rebuild();');

const lastBraceF = fc.lastIndexOf('}');
fc = fc.slice(0, lastBraceF) + fExtra + '\n}\n';

fs.writeFileSync(ff, fc, 'utf8');
console.log('Funds transformed successfully');
