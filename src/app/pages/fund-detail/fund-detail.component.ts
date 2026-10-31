import { Component, OnInit, OnDestroy, AfterViewInit, AfterViewChecked, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, TrendingUp, TrendingDown, AlertCircle, DollarSign, ShieldCheck, Star, Building2, Calendar, PieChart, BarChart3, FileText, ExternalLink, Loader2 } from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { SessionCacheService } from '../../services/session-cache.service';
import { FundDetailDto, FundListItemDto, FundPagedResultDto, FundPricePointDto, FundAnalysisDto, FundSimilarDto, FundCategoryMembershipDto, FundRiskLevel, FundType } from '../../models/api.models';
import { FavoriteToggleComponent } from '../../components/favorite-toggle/favorite-toggle.component';
import { LoadingSkeletonsComponent } from '../../components/loading-skeletons/loading-skeletons.component';
import {
  MzBackLinkComponent,
  MzDetailsHeaderCardComponent,
  MzDetailsSectionComponent,
  MzInfoGridComponent,
  MzInfoCardComponent,
  MzCardsGridComponent,
  MzHeaderTag,
  MzIndicator,
  MzListingCardData,
  MzAllocationBreakdownComponent,
  MzNumberLineComponent,
  MzSpinnerComponent,
  SHOW_FUND_ALLOCATION_BAR
} from '../../components/ui';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { fundLogoUrl, managerRouteParam, parseFundAllocations, type FundAllocationModel } from '../../models/fund-display';
import type { Chart, ChartConfiguration } from 'chart.js';

/**
 * Chart.js is loaded on demand (dynamic import) so its ~200 kB never lands in the
 * initial bundle — it is only fetched when a fund detail page with price history
 * actually renders a chart.
 */
let chartModule: typeof import('chart.js') | null = null;
async function ensureChartJs(): Promise<typeof import('chart.js') | null> {
  if (chartModule) return chartModule;
  try {
    chartModule = await import('chart.js');
    chartModule.Chart.register(...chartModule.registerables);
    return chartModule;
  } catch (e) {
    console.warn('chart.js could not be loaded', e);
    return null;
  }
}

@Component({
  selector: 'app-fund-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    LoadingSkeletonsComponent,
    MzBackLinkComponent,
    MzDetailsHeaderCardComponent,
    MzDetailsSectionComponent,
    MzInfoGridComponent,
    MzAllocationBreakdownComponent,
    MzSpinnerComponent
  ],
  template: `
    <div *ngIf="loading" class="mz-cards-area-wrap">
      <app-loading-skeletons variant="details"></app-loading-skeletons>
      <mz-spinner [active]="true" size="large" [overlay]="true" [showLabel]="true" label="جارٍ تحميل بيانات الصندوق..."></mz-spinner>
    </div>

    <div *ngIf="!loading && !fund" class="empty-state">
      <h3>لم يتم العثور على هذا الصندوق</h3>
      <a routerLink="/funds" class="text-link">العودة إلى قائمة الصناديق</a>
    </div>

    <div *ngIf="!loading && fund">
      <!-- Back Link -->
      <mz-back-link [to]="'/funds'" label="العودة إلى الصناديق"></mz-back-link>

      <!-- Details Header Card -->
      <mz-details-header-card
        [logoUrl]="heroLogoUrl"
        [title]="fund.displayName || fund.nameAr"
        [code]="fund.code"
        [secondaryName]="fund.nameEn"
        [favoriteSymbol]="'FUND:' + fund.code"
        [tags]="headerTags"
        priceLabel="السعر الحالي"
        [price]="fund.currentPrice != null ? (fund.currentPrice | number:'1.4-4') : '—'"
        [currency]="fund.currency || 'EGP'"
        [changeText]="fund.dailyChange != null ? ((fund.dailyChange > 0 ? '+' : '') + fund.dailyChange.toFixed(2) + '%') : null"
        [changeTone]="fund.dailyChange != null ? (fund.dailyChange > 0 ? 'positive' : (fund.dailyChange < 0 ? 'negative' : 'muted')) : 'muted'">
        <span titleBadge *ngIf="fund.isIslamic" class="mz-badge" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0">
          <lucide-icon [img]="ShieldCheckIcon" [size]="12"></lucide-icon> متوافق شرعياً
        </span>
      </mz-details-header-card>

      <div style="display: flex; flex-direction: column; gap: 24px; margin-top: 24px;">
        <!-- Section 1: Details & Overview -->
        <mz-details-section
          eyebrow="بيانات سريعة"
          title="تفاصيل الصندوق ومعلومات التأسيس">
          <a *ngIf="fund.prospectusUrl" action [href]="fund.prospectusUrl" target="_blank" rel="noopener noreferrer"
             class="mz-btn" style="background:#f0fdf4;border-color:#bbf7d0;color:#166534;font-size:12px;gap:6px">
            <lucide-icon [img]="FileTextIcon" [size]="15"></lucide-icon> عرض نشرة الإصدار الرسمية (PDF)
          </a>

          <mz-info-grid [items]="fundFundamentalsList"></mz-info-grid>

          <div *ngIf="fund.descriptionAr" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(188,202,192,.3);">
            <h3 class="mz-subtitle" style="margin-top:0">وصف الصندوق</h3>
            <p class="mz-authority-note" style="white-space: pre-wrap; font-size: 13px; line-height: 1.8;">{{ fund.descriptionAr }}</p>
          </div>
        </mz-details-section>

        <!-- Section 2: Historical Performance Chart -->
        <mz-details-section
          eyebrow="الأداء التاريخي"
          title="رسم بياني للأسعار وتطور العائد">
          <div action class="mz-perf-tabs" style="margin:0; background: #f1f5f9; padding: 4px; border-radius: 12px; gap: 4px;">
            <button *ngFor="let period of chartPeriods" type="button" class="mz-chip"
                    [class.active]="selectedPeriod === period.key"
                    (click)="selectPeriod(period.key)"
                    style="border: none; border-radius: 8px; font-weight: 600; font-size: 12px; padding: 6px 14px; transition: all 0.2s;"
                    [style.background]="selectedPeriod === period.key ? '#fff' : 'transparent'"
                    [style.color]="selectedPeriod === period.key ? '#059669' : '#64748b'"
                    [style.box-shadow]="selectedPeriod === period.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'">
              {{ period.label }}
            </button>
          </div>

          <div *ngIf="chartHasData()" style="width: 100%; background: rgba(248, 250, 252, 0.7); border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0; margin-top: 16px;">
            <div class="chart-container" style="height: 290px; position: relative;">
              <canvas #priceChart></canvas>
            </div>
          </div>

          <div *ngIf="!chartHasData()" class="mz-authority-note" style="text-align: center; padding: 40px 0;">
            لا توجد بيانات سعرية تاريخية متاحة لهذا الصندوق.
          </div>
        </mz-details-section>

        <!-- Section: Investment Strategy & Target Asset Allocation (NumberLine) -->
        <mz-details-section
          *ngIf="fund && (allocationModel.paragraphs.length > 0 || (showAllocationBreakdown && (fund.descriptionAr || fund.investmentStrategy || allocationModel.bands.length > 0)))"
          eyebrow="الاستراتيجية والمحفظة"
          title="استراتيجية وهيكل الاستثمار">
          <!-- Strategy & Fund Description Text Block -->
          <div *ngIf="allocationModel.paragraphs.length > 0" style="display: flex; flex-direction: column; gap: 12px;">
            <p *ngFor="let p of allocationModel.paragraphs" class="mz-authority-note" style="font-size: 13.5px; line-height: 1.8; color: #334155; margin: 0; text-align: justify;">
              {{ p }}
            </p>
          </div>

          <!-- Reusable Visual NumberLine & Breakdown Component -->
          <mz-allocation-breakdown
            *ngIf="showAllocationBreakdown"
            style="margin-top: 20px;"
            [instanceId]="'alloc_' + fund.code"
            [bands]="allocationModel.bands"
            [cards]="allocationModel.cards"
            [items]="allocationModel.fallbackAllocations"
            badgeText="معايير الالتزام والسياسة الاستثمارية"
            [ariaLabel]="'هيكل توزيع الأصول المستهدف لصندوق ' + fund.nameAr">
          </mz-allocation-breakdown>
        </mz-details-section>

        <!-- Section 3: Similar Funds (if present) -->
        <mz-details-section
          *ngIf="displaySimilarFunds && displaySimilarFunds.length > 0"
          eyebrow="صناديق مشابهة"
          title="صناديق في نفس الفئة">
          <div class="mz-grid cols-4" style="margin-bottom:0; align-items: stretch;">
            <a *ngFor="let sim of displaySimilarFunds" [routerLink]="['/funds', sim.slug || sim.id]"
               class="mz-card hoverable mz-lcard mz-sim-card">
              <div class="mz-lcard-head" style="align-items:flex-start;gap:10px;margin-bottom:14px;">
                <div class="mz-lcard-id" style="align-items:flex-start;gap:10px;min-width:0;flex:1;">
                  <div *ngIf="simLogoUrl(sim)" style="width:40px;height:40px;flex-shrink:0;border-radius:8px;border:1px solid rgba(188,202,192,.35);padding:2px;background:#fff;display:flex;align-items:center;justify-content:center;">
                    <img [src]="simLogoUrl(sim)" [alt]="sim.nameAr"
                         style="width:100%;height:100%;object-fit:contain;border-radius:6px;"
                         (error)="onSimLogoError($event)">
                  </div>
                  <div class="mz-lcard-text">
                    <h3 class="mz-lcard-title mz-sim-title">{{ sim.displayName || sim.nameAr || '—' }}</h3>
                  </div>
                </div>
                <div class="mz-lcard-badges" style="flex-shrink:0;">
                  <span class="mz-badge neutral"><span class="mz-ltr">{{ sim.code || '—' }}</span></span>
                </div>
              </div>
              <div class="mz-lcard-foot" style="margin-top:auto;padding-top:12px;flex-wrap:nowrap;">
                <span style="font-weight:600;color:var(--mz-primary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ sim.effectiveClassification?.leafNameAr || sim.effectiveClassification?.rootNameAr || sim.typeNameAr || '—' }}</span>
                <span style="color:var(--mz-primary);display:inline-flex;align-items:center;gap:2px;flex-shrink:0;white-space:nowrap;font-weight:700;">عرض الصندوق ←</span>
              </div>
            </a>
          </div>
        </mz-details-section>

        <!-- Section 4: Classification Memberships -->
        <mz-details-section
          eyebrow="التصنيفات والهيكلة"
          title="تصنيفات الصندوق والخصائص القانونية">
          <div *ngIf="classificationCards.length > 0" class="mz-grid cols-3-details" style="gap: 16px;">
            <a *ngFor="let c of classificationCards"
               [routerLink]="c.routerLink"
               [queryParams]="c.queryParams"
               style="padding: 20px; border-radius: 14px; border: 1px solid rgba(226, 232, 240, 0.9); background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; text-decoration: none; transition: all 0.2s;"
               class="mz-tax-card">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block;">{{ c.eyebrow }}</span>
                <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; line-height: 1.4;">{{ c.title }}</h4>
                <p *ngIf="c.description" style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">{{ c.description }}</p>
              </div>
              <div style="padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 700; color: #059669;">
                <span>{{ c.actionLabel }}</span>
                <span style="font-size: 14px;">←</span>
              </div>
            </a>
          </div>
          <p *ngIf="classificationCards.length === 0" class="mz-authority-note">
            لا توجد تصنيفات مسجلة لهذا الصندوق.
          </p>
        </mz-details-section>

        <!-- Section 5: Attribution / Disclaimer -->
        <footer class="mz-source-note" style="padding: 16px 0;">
          المصدر: <a href="https://snduk.com" target="_blank" rel="noopener noreferrer" style="color: var(--mz-primary); font-weight: 600;">SNDUK</a> |
          آخر تحديث: {{ lastSyncedAt ? (lastSyncedAt | date:'yyyy-MM-dd HH:mm') : '—' }} |
          <span style="color: var(--mz-error);">إخلاء المسؤولية: البيانات للأغراض المعلوماتية فقط ولا تُعد نصيحة استثمارية.</span>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 1fr; gap: 24px; padding: 0 24px 24px; }
    .detail-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
    .card-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .eyebrow { font-size: 12px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.05em; }
    .fundamentals { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .fundamentals div { display: flex; flex-direction: column; gap: 4px; }
    .fundamentals span { font-size: 12px; color: var(--muted-foreground); }
    .fundamentals strong { font-size: 14px; color: var(--ink); }
    .period-buttons { display: flex; gap: 8px; }
    .chart-container { width: 100%; height: 300px; }
    .chart-container:empty { display: none; }
    .scores-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
    .score-card { padding: 16px; border-radius: 12px; border: 2px solid; text-align: center; }
    .metric-card { padding: 12px; background: var(--muted); border-radius: 8px; display: flex; flex-direction: column; gap: 4px; }
    .metric-card span { font-size: 11px; color: var(--muted-foreground); text-transform: uppercase; }
    .metric-card strong { font-size: 16px; color: var(--ink); }
    .explanations div { border-left: 3px solid var(--primary); padding-left: 12px; }
    .similar-funds-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .similar-fund-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 180px;
      padding: 14px;
      background: white;
      border: 1px solid var(--border);
      border-radius: 12px;
      text-decoration: none;
      box-sizing: border-box;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .similar-fund-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .mz-tax-card:hover {
      background: #ffffff !important;
      border-color: #059669 !important;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.08) !important;
      transform: translateY(-2px);
    }
    .similar-logo-box {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .similar-logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
      border-radius: 8px;
      background: #fff;
      border: 1px solid var(--border);
    }
    .similar-code {
      font-weight: 600;
      font-size: 13px;
      height: 1.3em;
      line-height: 1.3em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--ink);
    }
    .similar-name-ar {
      font-size: 13px;
      color: var(--ink);
      margin-top: 4px;
      line-height: 1.45;
      white-space: normal;
      overflow: visible;
    }
    .mz-sim-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .mz-sim-title {
      font-size: 14px;
      line-height: 1.45;
      font-weight: 700;
      margin: 0;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      height: auto;
      display: block;
    }
    .similar-name-en {
      font-size: 11px;
      color: var(--muted-foreground);
      margin-top: 4px;
      height: 1.3em;
      line-height: 1.3em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      direction: ltr;
      text-align: right;
    }
    .similar-type {
      font-size: 11px;
      color: var(--primary);
      font-weight: 600;
      margin-top: auto;
      padding-top: 6px;
      height: 1.3em;
      line-height: 1.3em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .category-badge { font-weight: 500; }
    .class-path-badge {
      font-size: 11px; background: var(--muted); padding: 2px 8px; border-radius: 6px;
      border: 1px solid var(--border); max-width: 100%; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
    }
    .detail-logo {
      width: 34px;
      height: 34px;
      object-fit: contain;
      border-radius: 8px;
      background: #fff;
      border: 1px solid var(--border);
      vertical-align: middle;
      margin-inline-end: 8px;
    }
    .attribution a:hover { text-decoration: none; }
  `]
})
export class FundDetailComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  readonly ArrowLeftIcon = ArrowLeft;
  readonly TrendingUpIcon = TrendingUp;
  readonly TrendingDownIcon = TrendingDown;
  readonly AlertCircleIcon = AlertCircle;
  readonly DollarSignIcon = DollarSign;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly StarIcon = Star;
  readonly Building2Icon = Building2;
  readonly CalendarIcon = Calendar;
  readonly PieChartIcon = PieChart;
  readonly BarChart3Icon = BarChart3;
  readonly FileTextIcon = FileText;
  readonly ExternalLinkIcon = ExternalLink;
  readonly Loader2Icon = Loader2;
  readonly showAllocationBreakdown = SHOW_FUND_ALLOCATION_BAR;

  fund: FundDetailDto | null = null;
  allocationModel: FundAllocationModel = { bands: [], cards: [], fallbackAllocations: [], paragraphs: [] };
  displaySimilarFunds: FundSimilarDto[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  @ViewChild('priceChart') priceChartRef?: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  private viewReady = false;

  selectedPeriod = '1Y';
  chartPeriods = [
    { key: '1W', label: 'أسبوع' },
    { key: '1M', label: '1 شهر' },
    { key: '3M', label: '3 أشهر' },
    { key: '6M', label: '6 أشهر' },
    { key: '1Y', label: 'سنة' },
    { key: '3Y', label: '3 سنين' },
    { key: '5Y', label: '5 سنين' }
  ];

  /**
   * Generates classification and legal structure cards matching fund_code.html.
   * Derives cards from effectiveClassification hierarchy and categoryMemberships.
   */
  get classificationCards(): Array<{
    eyebrow: string;
    title: string;
    description: string;
    actionLabel: string;
    routerLink: string[];
    queryParams: Record<string, string>;
  }> {
    if (!this.fund) return [];
    const cards: Array<{
      eyebrow: string;
      title: string;
      description: string;
      actionLabel: string;
      routerLink: string[];
      queryParams: Record<string, string>;
    }> = [];

    const eff = this.fund.effectiveClassification;
    const names = eff?.pathNamesAr || [];
    const slugs = eff?.pathSlugs || [];

    // Card 1: Asset Class & Type
    const rootName = eff?.rootNameAr || this.fund.typeNameAr || 'صندوق استثمار';
    const rootSlug = eff?.rootSlug || this.fund.typeSlug || '';
    cards.push({
      eyebrow: 'نوع الصندوق والأصل',
      title: rootName,
      description: `استثمار في أصول ومحافظ ${rootName} وفقاً للسياسة الاستثمارية المعتمدة.`,
      actionLabel: `استعراض ${rootName}`,
      routerLink: ['/funds'],
      queryParams: rootSlug ? { node: rootSlug } : {}
    });

    // Card 2: Sharia Compliance (when Islamic)
    if (this.fund.isIslamic) {
      cards.push({
        eyebrow: 'الالتزام والضوابط الشرعية',
        title: 'صندوق متوافق مع أحكام الشريعة الإسلامية',
        description: 'يلتزم الصندوق بالمعايير والضوابط الشرعية المعتمدة وتحت إشراف هيئة رقابة شرعية معتمدة.',
        actionLabel: 'استعراض الصناديق المتوافقة',
        routerLink: ['/funds'],
        queryParams: { sharia: 'compliant' }
      });
    }

    // Card 3: Investment Style / Sub-category
    if (names.length > 1) {
      const subName = names[1];
      const subSlug = slugs[1] || '';
      const isIndex = subSlug.includes('index') || subName.includes('مؤشر');
      cards.push({
        eyebrow: 'النمط الاستثماري',
        title: subName,
        description: isIndex
          ? 'نموذج استثماري يحاكي حركة المؤشر المرجعي بهدف كفاءة التكلفة ودقة الأداء.'
          : 'نمط إدارة نشطة يركز على اقتناص أفضل الفرص الاستثمارية وتحقيق عائد متوازن.',
        actionLabel: `استعراض ${subName}`,
        routerLink: ['/funds'],
        queryParams: subSlug ? { node: subSlug } : {}
      });
    }

    // Card 4: Specific Strategy / Target Sector / Leaf Node
    if (names.length > 2) {
      const leafName = names[names.length - 1];
      const leafSlug = slugs[slugs.length - 1] || eff?.leafSlug || '';
      cards.push({
        eyebrow: 'المؤشر والقطاع المستهدف',
        title: leafName,
        description: `تغطية استثمارية مركزة تتبع استراتيجية ${leafName} عبر مختلف الأصول المؤهلة.`,
        actionLabel: `صناديق ${leafName}`,
        routerLink: ['/funds'],
        queryParams: leafSlug ? { node: leafSlug } : {}
      });
    }

    // Additional category memberships from backend
    if (this.fund.categoryMemberships && this.fund.categoryMemberships.length > 0) {
      for (const cm of this.fund.categoryMemberships) {
        if (!cards.some(c => c.title === cm.categoryNameAr)) {
          cards.push({
            eyebrow: cm.source === 'Manual' ? 'تصنيف معتمد' : 'تصنيف هيكلي',
            title: cm.categoryNameAr,
            description: `تصنيف معتمد ضمن هيكل ${cm.categoryNameAr} لصناديق الاستثمار.`,
            actionLabel: `استعراض ${cm.categoryNameAr}`,
            routerLink: ['/funds'],
            queryParams: cm.categorySlug ? { node: cm.categorySlug } : {}
          });
        }
      }
    }

    return cards;
  }

  lastSyncedAt: string | null = null;
  heroLogoUrl: string | null = null;

  /** Logo for the hero badge; null falls the <img> out via (error). */
  private computeHeroLogo(data: FundDetailDto): string | null {
    return fundLogoUrl(data.localLogoPath, data.logoUrl);
  }

  /** Logo for a similar-fund card. */
  simLogoUrl(sim: FundSimilarDto): string | null {
    return fundLogoUrl(sim.localLogoPath, sim.logoUrl);
  }

  /** A broken similar-fund logo is hidden rather than left as a broken icon. */
  onSimLogoError(ev: Event): void {
    const el = ev.target as HTMLImageElement | null;
    if (el) el.style.display = 'none';
  }

  /**
   * Compute similar funds client-side from the catalog.
   * Rules:
   *   1. Strictly match isIslamic (Islamic ↔ Islamic, conventional ↔ conventional).
   *   2. For equity funds: prioritise matching sub-category slug (active/index/sector),
   *      then leaf slug (tracks-egx33, sector-financial, …). Show only sub-matching
   *      funds when ≥ 2 are available.
   *   3. For non-equity funds: match root type, then sub/leaf if present.
   */
  private computeSimilarFunds(current: FundDetailDto, catalog: FundListItemDto[]): FundSimilarDto[] {
    const isIslamic = !!current.isIslamic;
    const eff = current.effectiveClassification;
    const rootSlug = eff?.rootSlug || current.typeSlug || '';
    const pathSlugs = eff?.pathSlugs ?? (rootSlug ? [rootSlug] : []);
    const subSlug = pathSlugs[1] ?? '';
    const leafSlug = eff?.leafSlug ?? pathSlugs[pathSlugs.length - 1] ?? '';

    // Must not be current fund, must strictly match Islamic flag
    const candidates = catalog.filter(f => f.id !== current.id && !!f.isIslamic === isIslamic);

    const scored = candidates.map(f => {
      const fEff = f.effectiveClassification;
      const fRoot = fEff?.rootSlug || f.typeSlug || '';
      const fSlugs = fEff?.pathSlugs ?? (fRoot ? [fRoot] : []);
      const fSub = fSlugs[1] ?? '';
      const fLeaf = fEff?.leafSlug ?? fSlugs[fSlugs.length - 1] ?? '';

      let score = 0;
      if (fRoot && fRoot === rootSlug) {
        score += 10;
        if (rootSlug === 'equity') {
          if (subSlug && fSub === subSlug) {
            score += 40;
            if (leafSlug && fLeaf === leafSlug) score += 50;
          }
        } else {
          if (subSlug && fSub === subSlug) score += 30;
          if (leafSlug && fLeaf === leafSlug) score += 30;
        }
      }
      return { fund: f, score };
    });

    let matches = scored.filter(s => s.score >= 10);
    matches.sort((a, b) => b.score - a.score || (b.fund.totalScore ?? 0) - (a.fund.totalScore ?? 0));

    // For equity funds: if there are ≥2 sub-matching funds, restrict to them
    if (rootSlug === 'equity' && subSlug) {
      const subMatches = matches.filter(m => m.score >= 50);
      if (subMatches.length >= 2) matches = subMatches;
    }

    return matches.slice(0, 8).map(m => ({
      id: m.fund.id,
      slug: m.fund.slug ?? null,
      code: m.fund.code,
      nameAr: m.fund.nameAr,
      displayName: m.fund.displayName || m.fund.nameAr,
      fullNameAr: m.fund.fullNameAr || m.fund.nameAr,
      nameEn: m.fund.nameEn,
      localLogoPath: m.fund.localLogoPath ?? null,
      logoUrl: m.fund.logoUrl ?? null,
      typeNameAr: m.fund.typeNameAr ?? null,
      typeNameEn: m.fund.typeNameEn ?? null,
      typeSlug: m.fund.typeSlug ?? null,
      classificationPathAr: m.fund.classificationPathAr ?? null,
      effectiveClassification: m.fund.effectiveClassification ?? null
    }));
  }

  /** Fetch the full fund catalog (two pages of 100) and compute client-side similar funds. */
  private loadAllFundsForSimilar(current: FundDetailDto): void {
    const CACHE_KEY = 'fund_catalog_all';
    const cached = this.cache.get<FundListItemDto[]>(CACHE_KEY);
    if (cached && !this.cache.isStale(CACHE_KEY, 10 * 60 * 1000)) {
      this.displaySimilarFunds = this.computeSimilarFunds(current, cached.data);
      return;
    }

    forkJoin([
      this.api.getFunds({ page: 1, pageSize: 100 }),
      this.api.getFunds({ page: 2, pageSize: 100 })
    ]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([p1, p2]) => {
        const all = [...(p1.items ?? []), ...(p2.items ?? [])];
        this.cache.set(CACHE_KEY, all);
        this.displaySimilarFunds = this.computeSimilarFunds(current, all);
      },
      error: () => {
        // Fallback to backend-provided similar funds
        this.displaySimilarFunds = current.similarFunds ?? [];
      }
    });
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private ngZone: NgZone,
    private cache: SessionCacheService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const slug = params.get('slug');
      if (slug) this.loadFund(slug);
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    // Covers the case where data arrived BEFORE the view existed (cached route reuse).
    if (this.fund) {
      this.chartHasDataFlag = this.visiblePoints().length >= 2;
      this.chartNeedsRender = true;
    }
  }

  /**
   * The <canvas> is behind *ngIf="!loading && fund", so it only exists after the
   * view has been checked. Rendering from here guarantees the ViewChild is
   * resolved. Guarded by chartNeedsRender so it runs once per data/period change.
   */
  ngAfterViewChecked(): void {
    if (!this.chartNeedsRender) return;
    this.chartNeedsRender = false;
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyChart();
  }

  loadFund(slug: string): void {
    const cacheKey = `fund_detail_${slug}`;
    const cached = this.cache.get<FundDetailDto>(cacheKey);

    if (cached) {
      this.fund = cached.data;
      this.lastSyncedAt = cached.data.lastSyncedAt || null;
      this.heroLogoUrl = this.computeHeroLogo(cached.data);
      this.allocationModel = parseFundAllocations(cached.data.descriptionAr, cached.data.investmentStrategy, cached.data.typeSlug);
      this.loading = false;
      this.chartHasDataFlag = this.visiblePoints().length >= 2;
      this.chartNeedsRender = true;
      this.loadAllFundsForSimilar(cached.data);
      if (!this.cache.isStale(cacheKey)) {
        return;
      }
    } else {
      this.loading = true;
      this.displaySimilarFunds = [];
      this.destroyChart();
    }

    this.api.getFundBySlug(slug).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.cache.set(cacheKey, data);
        this.fund = data;
        this.lastSyncedAt = data.lastSyncedAt || null;
        this.heroLogoUrl = this.computeHeroLogo(data);
        this.allocationModel = parseFundAllocations(data.descriptionAr, data.investmentStrategy, data.typeSlug);
        this.loading = false;
        this.chartHasDataFlag = this.visiblePoints().length >= 2;
        this.chartNeedsRender = true;
        this.loadAllFundsForSimilar(data);
      },
      error: () => {
        if (!cached) {
          this.fund = null;
          this.chartHasDataFlag = false;
          this.chartNeedsRender = false;
          this.loading = false;
        }
      }
    });
  }

  /** Points inside the selected window, ascending by date. */
  private visiblePoints(): FundPricePointDto[] {
    const raw = this.fund?.priceHistory ?? [];
    if (raw.length === 0) return [];

    // 1. Always sort points ascending by date on a safe copy without mutating source data
    const all = raw
      .map(p => ({ p, t: new Date(p.date).getTime() }))
      .filter(item => !isNaN(item.t))
      .sort((a, b) => a.t - b.t)
      .map(item => item.p);

    if (all.length === 0) return [];
    if (this.selectedPeriod === 'ALL') return all;

    const lastPointTime = new Date(all[all.length - 1].date).getTime();

    // 2. Week: points within 7 calendar days up to and including the last point
    if (this.selectedPeriod === '1W') {
      const cutoffWeek = new Date(lastPointTime);
      cutoffWeek.setDate(cutoffWeek.getDate() - 7);
      const weekPoints = all.filter(p => new Date(p.date).getTime() >= cutoffWeek.getTime());

      // If fewer than 2 points, fall back to the last 5 points
      if (weekPoints.length < 2) {
        return all.slice(-5);
      }
      return weekPoints;
    }

    const months = this.selectedPeriod === '1M' ? 1
      : this.selectedPeriod === '3M' ? 3
      : this.selectedPeriod === '6M' ? 6
      : this.selectedPeriod === '1Y' ? 12
      : this.selectedPeriod === '3Y' ? 36
      : 60;
    const cutoff = new Date(lastPointTime);
    cutoff.setMonth(cutoff.getMonth() - months);
    return all.filter(p => new Date(p.date).getTime() >= cutoff.getTime());
  }

  /**
   * Cached flag for the empty state. Computed when the data or the period
   * changes — NOT a template getter, because visiblePoints() allocates and
   * filters up to ~700 rows and would run on every change-detection cycle
   * (Chart.js animations drive those continuously).
   */
  private chartHasDataFlag = false;

  chartHasData(): boolean {
    return this.chartHasDataFlag;
  }

  selectPeriod(key: string): void {
    this.selectedPeriod = key;
    this.chartHasDataFlag = this.visiblePoints().length >= 2;
    this.chartNeedsRender = true;
    this.renderChart();
  }

  private chartNeedsRender = false;

  private renderChart(): void {
    if (!this.viewReady || this.loading) return;
    if (!this.chartHasDataFlag) {
      this.destroyChart();
      return;
    }
    const canvas = this.priceChartRef?.nativeElement;
    if (!canvas) {
      this.chartNeedsRender = true;
      return;
    }

    this.destroyChart();

    const points = this.visiblePoints();
    if (points.length < 2) return;

    this.paintChart(canvas, points);
  }

  private paintChart(canvas: HTMLCanvasElement, points: FundPricePointDto[]): void {
    const context = canvas.getContext('2d');
    if (!context) return;

    // Calculate time span of visible points to choose appropriate date label format
    const firstTime = new Date(points[0].date).getTime();
    const lastTime = new Date(points[points.length - 1].date).getTime();
    const spanDays = Math.max(0, (lastTime - firstTime) / (1000 * 60 * 60 * 24));

    const pad = (n: number) => String(n).padStart(2, '0');
    const labels = points.map(p => {
      const d = new Date(p.date);
      if (isNaN(d.getTime())) return p.date;
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      return spanDays <= 180 ? `${m}/${day}` : `${d.getFullYear()}/${m}/${day}`;
    });
    const values = points.map(p => Number(p.price));

    const gradient = context.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(5, 150, 105, 0.25)');
    gradient.addColorStop(1, 'rgba(5, 150, 105, 0.0)');

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'سعر الوحدة',
          data: values,
          borderColor: '#059669',
          backgroundColor: gradient,
          borderWidth: 2.5,
          pointRadius: values.length > 120 ? 0 : 3,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#059669',
          tension: 0.25,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl: true,
            callbacks: {
              title: items => {
                const idx = items[0]?.dataIndex;
                if (idx != null && points[idx]) {
                  const d = new Date(points[idx].date);
                  return isNaN(d.getTime())
                    ? points[idx].date
                    : d.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
                }
                return items[0]?.label ?? '';
              },
              label: ctx => ` ${this.fund?.currency ?? 'ج.م'} ${Number(ctx.parsed.y).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`.trim()
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 8, autoSkip: true, maxRotation: 0, font: { size: 10 } },
            reverse: false
          },
          y: {
            position: 'right',
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { font: { size: 10 }, maxTicksLimit: 6 }
          }
        }
      }
    };

    this.ngZone.runOutsideAngular(() => {
      void ensureChartJs().then(mod => {
        if (!mod) return;
        // The component may have navigated away while chart.js was loading.
        if (!this.viewReady || !this.priceChartRef) return;
        try {
          this.chart = new mod.Chart(context, config);
        } catch (e) {
          // Never let a chart failure block the page body from rendering.
          this.chart = null;
          console.warn('Fund price chart could not be created', e);
        }
      });
    });
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  getRiskLabel(risk: FundRiskLevel): string {
    switch (risk) {
      case 'low': return 'منخفضة';
      case 'medium': return 'متوسطة';
      case 'high': return 'عالية';
      default: return 'غير محدد';
    }
  }

  getRiskColor(risk: FundRiskLevel): string {
    switch (risk) {
      case 'low': return 'var(--good)';
      case 'medium': return 'var(--warning)';
      case 'high': return 'var(--bad)';
      default: return 'var(--muted-foreground)';
    }
  }

  getFundAccent(type: FundType): { accent: string; tint: string; ink: string } {
    switch (type) {
      case 'equity': return { accent: '#2563eb', tint: '#dbeafe', ink: '#1e40af' };
      case 'fixed_income': return { accent: '#16a34a', tint: '#dcfce7', ink: '#166534' };
      case 'money_market': return { accent: '#0891b2', tint: '#cffafe', ink: '#0e7490' };
      case 'balanced': return { accent: '#9333ea', tint: '#f3e8ff', ink: '#6b21a8' };
      case 'index': return { accent: '#f59e0b', tint: '#fef3c7', ink: '#92400e' };
      case 'gold': return { accent: '#f59e0b', tint: '#fef3c7', ink: '#92400e' };
      default: return { accent: '#64748b', tint: '#f1f5f9', ink: '#475569' };
    }
  }

  getCategoryColor(source: string): string {
    switch (source) {
      case 'Auto': return '#dbeafe';
      case 'Manual': return '#fef3c7';
      case 'Excluded': return '#fee2e2';
      default: return '#f3f4f6';
    }
  }

  // ── Mappers for shared UI components ────────────────────────────────
  get managerLink(): string[] | null {
    if (!this.fund) return null;
    const param = managerRouteParam(this.fund.assetManagerId, this.fund.assetManagerName);
    return param ? ['/fund-managers', param] : null;
  }

  get headerTags(): MzHeaderTag[] {
    if (!this.fund) return [];
    const tags: MzHeaderTag[] = [];
    if (this.fund.classificationPathAr) {
      tags.push({ label: this.fund.classificationPathAr, tone: 'neutral' });
    }
    const typeLabel = this.fund.effectiveClassification?.rootNameAr || this.fund.typeNameAr;
    if (typeLabel) {
      tags.push({ label: typeLabel, tone: 'default' });
    }
    if (this.fund.assetManagerName && this.fund.assetManagerName.trim()) {
      tags.push({
        label: this.fund.assetManagerName,
        tone: 'outline',
        link: this.managerLink,
        ariaLabel: `عرض جميع صناديق شركة ${this.fund.assetManagerName}`
      });
    }
    if (this.fund.isFeatured) {
      tags.push({ label: 'مميز ★', tone: 'warn' });
    }
    return tags;
  }

  get fundFundamentalsList(): MzIndicator[] {
    if (!this.fund) return [];
    const f = this.fund;
    const mgrName = f.assetManagerName && f.assetManagerName.trim() ? f.assetManagerName : '—';
    return [
      { label: 'الاسم الكامل', value: f.fullNameAr || f.nameAr || '—' },
      { label: 'كود الصندوق', value: f.code, ltr: true },
      { label: 'المدير', value: mgrName },
      { label: 'العملة', value: f.currency, ltr: true },
      { label: 'تاريخ التأسيس', value: f.inceptionDate ? new Date(f.inceptionDate).toISOString().slice(0, 10) : '—', ltr: true },
      { label: 'الحد الأدنى للاستثمار', value: f.minimumInvestment || '—' },
      { label: 'الرسوم السنوية', value: f.managementFee !== null ? f.managementFee + '%' : '—', ltr: true },
      { label: 'إجمالي الأصول (AUM)', value: f.aum !== null ? (f.aum >= 1e9 ? (f.aum / 1e9).toFixed(2) + ' مليار ج.م' : (f.aum / 1e6).toFixed(1) + ' مليون ج.م') : '—', ltr: true }
    ];
  }

}
