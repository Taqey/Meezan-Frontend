import { Component, OnInit, OnDestroy, AfterViewInit, AfterViewChecked, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, TrendingUp, TrendingDown, AlertCircle, DollarSign, ShieldCheck, Star, Building2, Calendar, PieChart, BarChart3, FileText, ExternalLink, Loader2 } from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { FundDetailDto, FundPricePointDto, FundAnalysisDto, FundSimilarDto, FundCategoryMembershipDto, FundRiskLevel, FundType } from '../../models/api.models';
import { FavoriteToggleComponent } from '../../components/favorite-toggle/favorite-toggle.component';
import { Subject, takeUntil } from 'rxjs';
import { fundLogoUrl } from '../../models/fund-display';
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
  imports: [CommonModule, RouterLink, LucideAngularModule, FavoriteToggleComponent],
  template: `
    <div *ngIf="loading" class="empty-state">
      <lucide-icon [img]="Loader2Icon" size="32" class="animate-spin"></lucide-icon>
      <p>جارٍ تحميل بيانات الصندوق...</p>
    </div>

    <div *ngIf="!loading && !fund" class="empty-state">
      <h3>لم يتم العثور على هذا الصندوق</h3>
      <a routerLink="/funds" class="text-link">العودة إلى قائمة الصناديق</a>
    </div>

    <div *ngIf="!loading && fund">
      <div class="detail-hero">
        <button type="button" (click)="goBack()" class="back-link">
          <lucide-icon [img]="ArrowLeftIcon" size="15"></lucide-icon> العودة إلى الصناديق
        </button>

        <div class="detail-heading">
          <div>
            <div class="ticker large">
              <img class="detail-logo"
                   [src]="heroLogoUrl"
                   [alt]="fund.nameAr"
                   loading="eager"
                   (error)="heroLogoUrl = null">
              {{ fund.code }}
              <app-favorite-toggle [symbol]="fund.code"></app-favorite-toggle>
              <span *ngIf="fund.nameEn">{{ fund.nameEn }}</span>
            </div>
            <h1>{{ fund.nameAr }}</h1>
            <div class="tag-row">
              <span *ngIf="fund.classificationPathAr" class="class-path-badge" [title]="fund.classificationPathAr">
                {{ fund.classificationPathAr }}
              </span>
              <span class="fund-type" [style.background]="getFundAccent(fund.type).tint" [style.color]="getFundAccent(fund.type).accent">
                {{ fund.effectiveClassification?.rootNameAr || fund.typeNameAr }}
              </span>
              <span *ngIf="fund.assetManagerName" style="font-size: 12px; background: var(--muted); padding: 2px 8px; border-radius: 6px; border: 1px solid var(--border);">
                {{ fund.assetManagerName }}
              </span>
              <span *ngIf="fund.isIslamic" style="font-size: 11px; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 6px; border: 1px solid #bbf7d0;">
                <lucide-icon [img]="ShieldCheckIcon" size="12"></lucide-icon> متوافق شرعياً
              </span>
              <span *ngIf="fund.isFeatured" style="font-size: 11px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 6px; border: 1px solid #fcd34d;">
                <lucide-icon [img]="StarIcon" size="12"></lucide-icon> مميز
              </span>
            </div>
          </div>

          <div class="detail-price" *ngIf="fund.currentPrice !== null && fund.currentPrice !== undefined">
            <span>السعر الحالي</span>
            <strong>{{ fund.currentPrice | number:'1.4-4' }} <small>{{ fund.currency }}</small></strong>
            <b [style.color]="fund.dailyChange !== null && fund.dailyChange > 0 ? 'var(--good)' : (fund.dailyChange !== null && fund.dailyChange < 0 ? 'var(--bad)' : 'inherit')">
              {{ fund.dailyChange !== null && fund.dailyChange > 0 ? '+' : '' }}{{ fund.dailyChange?.toFixed(2) }}%
            </b>
          </div>
          <div class="detail-price" *ngIf="fund.currentPrice === null || fund.currentPrice === undefined">
            <span class="muted">السعر الحالي</span>
            <strong>—</strong>
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-card">
          <div class="card-heading">
            <div>
              <span class="eyebrow">معلومات أساسية</span>
              <h2>تفاصيل الصندوق</h2>
            </div>
          </div>

          <div class="fundamentals" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div><span>كود الصندوق</span><strong style="font-family: monospace;">{{ fund.code }}</strong></div>
            <div><span>المدير</span><strong>{{ fund.assetManagerName || '—' }}</strong></div>
            <div><span>العملة</span><strong>{{ fund.currency }}</strong></div>
            <div><span>تاريخ التأسيس</span><strong>{{ fund.inceptionDate ? (fund.inceptionDate | date:'yyyy-MM-dd') : '—' }}</strong></div>
            <div><span>الحد الأدنى للاستثمار</span><strong>{{ fund.minimumInvestment || '—' }}</strong></div>
            <div><span>الرسوم السنوية</span><strong>{{ fund.managementFee !== null ? fund.managementFee + '%' : '—' }}</strong></div>
            <div><span>إجمالي الأصول (AUM)</span><strong>{{ fund.aum !== null ? (fund.aum / 1e6).toFixed(1) + ' م' + fund.currency : '—' }}</strong></div>
            <div><span>مستوى المخاطر</span><strong [style.color]="getRiskColor(fund.riskLevel)">{{ getRiskLabel(fund.riskLevel) }}</strong></div>
          </div>

          <div *ngIf="fund.prospectusUrl" style="margin-top: 16px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
            <a [href]="fund.prospectusUrl" target="_blank" rel="noopener" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 8px;">
              <lucide-icon [img]="FileTextIcon" size="16"></lucide-icon> عرض نشرة الإصدار
            </a>
            <span class="muted" style="margin-right: 12px; font-size: 11px;">يفتح في نافذة جديدة</span>
          </div>

          <div *ngIf="fund.descriptionAr" style="margin-top: 16px;">
            <h3 style="margin: 0 0 8px;">وصف الصندوق</h3>
            <p class="muted" style="white-space: pre-wrap;">{{ fund.descriptionAr }}</p>
          </div>
        </div>

        <div class="detail-card">
          <div class="card-heading">
            <div>
              <span class="eyebrow">الأداء التاريخي</span>
              <h2>رسم بياني للأسعار</h2>
            </div>
            <div class="period-buttons" style="display: flex; gap: 8px;">
              <button *ngFor="let period of chartPeriods" class="btn btn-outline" [class.active]="selectedPeriod === period.key" (click)="selectPeriod(period.key)" style="font-size: 12px; padding: 4px 12px;">{{ period.label }}</button>
            </div>
          </div>

          <div class="chart-container" style="height: 300px; position: relative;">
            <canvas #priceChart></canvas>
          </div>

          <div *ngIf="!chartHasData()" class="muted" style="text-align: center; padding: 40px;">
            لا توجد بيانات سعرية تاريخية متاحة لهذا الصندوق.
          </div>
        </div>

        <div class="detail-card" *ngIf="fund.analysis">
          <div class="card-heading">
            <div>
              <span class="eyebrow">تحليل SNDUK</span>
              <h2>درجات ومؤشرات التحليل</h2>
            </div>
            <span class="muted" *ngIf="fund.analysis.calculatedAt">آخر تحديث: {{ fund.analysis.calculatedAt | date:'yyyy-MM-dd' }}</span>
          </div>

          <div class="scores-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px;">
            <div *ngFor="let score of analysisScores" class="score-card" [style.border-color]="score.color" [style.background]="score.color + '15'">
              <div style="font-size: 11px; color: var(--muted-foreground); text-transform: uppercase;">{{ score.label }}</div>
              <div style="font-size: 28px; font-weight: 700; color: var(--ink);" *ngIf="score.value !== null">{{ score.value | number:'1.1-1' }}</div>
              <div style="font-size: 28px; font-weight: 700; color: var(--muted-foreground);" *ngIf="score.value === null">—</div>
              <div style="font-size: 11px; color: {{ score.color }}; margin-top: 4px;" *ngIf="score.value !== null">{{ score.badge }}</div>
            </div>
          </div>

          <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 16px;">
            <div *ngFor="let metric of analysisMetrics" class="metric-card">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
            </div>
          </div>

          <div class="explanations" style="margin-top: 20px;">
            <h3 style="margin: 0 0 12px;">ملاحظات التحليل</h3>
            <div *ngFor="let exp of analysisExplanations" style="margin-bottom: 12px; padding: 12px; background: var(--muted); border-radius: 8px;">
              <strong style="color: var(--primary);">{{ exp.title }}:</strong>
              <p style="margin: 8px 0 0; color: var(--muted-foreground);">{{ exp.text }}</p>
            </div>
          </div>
        </div>

        <div class="detail-card" *ngIf="fund.similarFunds && fund.similarFunds.length > 0">
          <div class="card-heading">
            <div>
              <span class="eyebrow">صناديق مشابهة</span>
              <h2>صناديق في نفس الفئة</h2>
            </div>
          </div>
          <div class="similar-funds-grid">
            <a *ngFor="let sim of fund.similarFunds" [routerLink]="['/funds', sim.id]" class="similar-fund-card">
              <div class="similar-logo-box">
                <img class="similar-logo" [src]="simLogoUrl(sim)" [alt]="sim.nameAr" loading="lazy" (error)="onSimLogoError($event)">
              </div>
              <div class="similar-code" [attr.title]="sim.code">{{ sim.code || '—' }}</div>
              <div class="similar-name-ar" [attr.title]="sim.nameAr">{{ sim.nameAr || '—' }}</div>
              <div class="similar-name-en" [attr.title]="sim.nameEn">{{ sim.nameEn || '—' }}</div>
              <div class="similar-type" [attr.title]="sim.effectiveClassification?.rootNameAr || sim.typeNameAr">
                {{ sim.effectiveClassification?.rootNameAr || sim.typeNameAr || '—' }}
              </div>
            </a>
          </div>
        </div>

        <div class="detail-card">
          <div class="card-heading">
            <div>
              <span class="eyebrow">التصنيفات</span>
              <h2>الانتماء للتصنيفات</h2>
            </div>
          </div>
          <div *ngIf="fund.categoryMemberships && fund.categoryMemberships.length > 0" style="display: flex; flex-wrap: wrap; gap: 8px;">
            <span *ngFor="let cm of fund.categoryMemberships" class="category-badge" [style.background]="getCategoryColor(cm.source)" style="color: var(--ink); padding: 4px 10px; border-radius: 999px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
              {{ cm.categoryNameAr }}
              <span style="font-size: 10px; opacity: 0.7;">{{ cm.source }}</span>
            </span>
          </div>
          <div *ngIf="!fund.categoryMemberships || fund.categoryMemberships.length === 0" class="muted" style="padding: 16px;">
            لا يوجد تصنيفات مسجلة لهذا الصندوق.
          </div>
        </div>

        <div class="attribution" style="margin: 24px 0; padding: 16px; background: var(--muted); border-radius: 12px; text-align: center; font-size: 12px; color: var(--muted-foreground);">
          المصدر: <a href="https://snduk.com" target="_blank" rel="noopener" style="color: var(--primary); text-decoration: underline;">SNDUK</a> |
          آخر تحديث: {{ lastSyncedAt ? (lastSyncedAt | date:'yyyy-MM-dd HH:mm') : '—' }} |
          <span style="color: var(--bad);">إخلاء المسؤولية: البيانات للأغراض المعلوماتية فقط ولا تُعد نصيحة استثمارية.</span>
        </div>
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
      font-size: 12px;
      color: var(--ink);
      margin-top: 4px;
      height: 2.8em;
      line-height: 1.4em;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
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

  fund: FundDetailDto | null = null;
  loading = true;
  private destroy$ = new Subject<void>();

  @ViewChild('priceChart') priceChartRef?: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  private viewReady = false;

  selectedPeriod = '1Y';
  chartPeriods = [
    { key: '1M', label: '1 شهر' },
    { key: '3M', label: '3 أشهر' },
    { key: '6M', label: '6 أشهر' },
    { key: '1Y', label: 'سنة' },
    { key: 'ALL', label: 'الكل' }
  ];

  get analysisScores() {
    if (!this.fund?.analysis) return [];
    const a = this.fund.analysis;
    return [
      { label: 'الأداء', value: a.performanceScore, color: '#2563eb', badge: a.performanceScore !== null ? (a.performanceScore >= 70 ? 'ممتاز' : a.performanceScore >= 50 ? 'جيد' : 'ضعيف') : 'غير متاح' },
      { label: 'المخاطر', value: a.riskScore, color: '#dc2626', badge: a.riskScore !== null ? (a.riskScore <= 30 ? 'منخفضة' : a.riskScore <= 60 ? 'متوسطة' : 'عالية') : 'غير متاح' },
      { label: 'التكلفة', value: a.costScore, color: '#f59e0b', badge: a.costScore !== null ? (a.costScore >= 70 ? 'منخفضة' : a.costScore >= 50 ? 'متوسطة' : 'عالية') : 'غير متاح' },
      { label: 'الاستقرار', value: a.stabilityScore, color: '#059669', badge: a.stabilityScore !== null ? (a.stabilityScore >= 70 ? 'مستقر' : a.stabilityScore >= 50 ? 'متقلب' : 'غير مستقر') : 'غير متاح' },
      { label: 'التنوع', value: a.diversificationScore, color: '#7c3aed', badge: a.diversificationScore !== null ? (a.diversificationScore >= 70 ? 'متنوع' : a.diversificationScore >= 50 ? 'متوسط' : 'متركز') : 'غير متاح' },
      { label: 'الإجمالي', value: a.totalScore, color: '#111827', badge: a.totalScore !== null ? (a.totalScore >= 70 ? 'ممتاز' : a.totalScore >= 50 ? 'جيد' : 'ضعيف') : 'غير متاح' }
    ];
  }

  get analysisMetrics() {
    if (!this.fund?.analysis) return [];
    const a = this.fund.analysis;
    return [
      { label: 'معدل النمو السنوي المركب (CAGR)', value: a.cagr !== null ? a.cagr + '%' : '—' },
      { label: 'ألفا', value: a.alpha !== null ? a.alpha : '—' },
      { label: 'التقلبات', value: a.volatility !== null ? a.volatility + '%' : '—' },
      { label: 'أقصى تراجع', value: a.maxDrawdown !== null ? a.maxDrawdown + '%' : '—' },
      { label: 'نسبة شارب', value: a.sharpeRatio !== null ? a.sharpeRatio : '—' }
    ];
  }

  get analysisExplanations() {
    if (!this.fund?.analysis) return [];
    const a = this.fund.analysis;
    return [
      { title: 'الأداء', text: a.performanceExplanationAr },
      { title: 'المخاطر', text: a.riskExplanationAr },
      { title: 'التكلفة', text: a.costExplanationAr },
      { title: 'الاستقرار', text: a.stabilityExplanationAr },
      { title: 'التنوع', text: a.diversificationExplanationAr }
    ].filter(e => e.text);
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private ngZone: NgZone,
    private location: Location,
  ) {}

  /** Navigate back to the funds list, restoring scroll position via popstate. */
  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/funds');
    }
  }

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
      this.chartHasDataFlag = this.visiblePoints().length > 0;
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
    this.loading = true;
    this.destroyChart();
    this.api.getFundBySlug(slug).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.fund = data;
        this.lastSyncedAt = data.lastSyncedAt || null;
        this.heroLogoUrl = this.computeHeroLogo(data);
        this.loading = false;
        this.chartHasDataFlag = this.visiblePoints().length > 0;
        // The canvas lives behind *ngIf="!loading && fund". eventCoalescing defers
        // change detection to requestAnimationFrame, so a plain setTimeout can run
        // before the ViewChild resolves; ngAfterViewChecked is the correct hook.
        this.chartNeedsRender = true;
      },
      error: () => {
        this.fund = null;
        this.chartHasDataFlag = false;
        this.chartNeedsRender = false;
        this.loading = false;
      }
    });
  }

  /** Points inside the selected window, ascending by date. */
  private visiblePoints(): FundPricePointDto[] {
    const all = this.fund?.priceHistory ?? [];
    if (all.length === 0) return [];
    if (this.selectedPeriod === 'ALL') return all.slice();

    const months = this.selectedPeriod === '1M' ? 1
      : this.selectedPeriod === '3M' ? 3
      : this.selectedPeriod === '6M' ? 6
      : 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return all.filter(p => {
      const d = new Date(p.date);
      return !isNaN(d.getTime()) && d >= cutoff;
    });
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
    this.chartHasDataFlag = this.visiblePoints().length > 0;
    this.renderChart();
  }

  private chartNeedsRender = false;

  private renderChart(): void {
    if (!this.viewReady || this.loading) return;
    const canvas = this.priceChartRef?.nativeElement;
    if (!canvas) return;

    this.destroyChart();

    const points = this.visiblePoints();
    if (points.length === 0) return;

    this.paintChart(canvas, points);
  }

  private paintChart(canvas: HTMLCanvasElement, points: FundPricePointDto[]): void {
    const context = canvas.getContext('2d');
    if (!context) return;

    const labels = points.map(p => {
      const d = new Date(p.date);
      return isNaN(d.getTime())
        ? p.date
        : d.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
    });
    const prices = points.map(p => Number(p.price));
    const values = prices.slice().reverse();
    const revLabels = labels.slice().reverse();

    const gradient = context.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: revLabels,
        datasets: [{
          label: 'سعر الوحدة',
          data: values,
          borderColor: '#2563eb',
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: values.length > 120 ? 0 : 3,
          pointHoverRadius: 5,
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
              title: items => items[0]?.label ?? '',
              label: ctx => ` ${this.fund?.currency ?? ''} ${Number(ctx.parsed.y).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`.trim()
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
}
