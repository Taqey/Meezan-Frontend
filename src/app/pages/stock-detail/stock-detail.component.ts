import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Layers,
  FileText,
  Check,
  X,
  Minus
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { SessionCacheService } from '../../services/session-cache.service';
import { ComparisonBadgeComponent } from '../../components/comparison-badge/comparison-badge.component';
import {
  MzBackLinkComponent,
  MzDetailsHeaderCardComponent,
  MzSupportResistanceCardComponent,
  MzFairValueCardComponent,
  MzMarketIndicatorsSectionComponent,
  MzShariaAuthoritiesSectionComponent,
  MzDetailsSectionComponent,
  MzInfoGridComponent,
  MzHeaderTag,
  MzSrPoint,
  MzFairMethod,
  MzIndicator,
  MzAuthority,
  MzMetric,
  MzShariaRatio,
  MzSpinnerComponent
} from '../../components/ui';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { FavoriteToggleComponent } from '../../components/favorite-toggle/favorite-toggle.component';
import { LoadingSkeletonsComponent } from '../../components/loading-skeletons/loading-skeletons.component';
import { RevealDirective } from '../../directives/reveal.directive';
import {
  IndexInStockDto,
  MarketDataDto,
  SectorSummaryDto,
  SHARIAH_SOURCE_NAMES,
  ShariahSourceKey,
  ShariahSourceOpinionDto,
  SupportResistanceDto,
  INDEX_ARABIC_NAMES,
  SHARIAH_BOARD_FROZEN_TICKERS,
  StoredVerdictDetailsDto
} from '../../models/api.models';
import {
  CRITERION_LABELS,
  CRITERION_ORDER,
  normalizeStatusValue,
  SCHOLARS_STANDARD_NAME_AR,
  SCHOLARS_STANDARD_NAME_EN,
  scholarsDebtMax,
  type ShariahCriterionKey
} from '../../models/shariah-standards';
import { indexShortNameFor } from '../../models/market-icons';

/** One board's card: either its real stored opinion, or an explicit "no opinion" state. */
type ShariahSourceOpinionView = ShariahSourceOpinionDto & { noOpinion: boolean };

/** Card view: Halal Bourse carries the STORED verdict; other boards carry raw (doubtful sanitized to no-opinion). */
type EffectiveOpinionView = ShariahSourceOpinionView & { effectiveStatus: string | null; rawDisplayStatus: string | null; upgraded: boolean };

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    ComparisonBadgeComponent,
    LoadingSkeletonsComponent,
    RevealDirective,
    MzBackLinkComponent,
    MzDetailsHeaderCardComponent,
    MzSupportResistanceCardComponent,
    MzFairValueCardComponent,
    MzMarketIndicatorsSectionComponent,
    MzShariaAuthoritiesSectionComponent,
    MzDetailsSectionComponent,
    MzSpinnerComponent
  ],
  template: `
    <div *ngIf="loading" class="mz-cards-area-wrap">
      <app-loading-skeletons variant="details"></app-loading-skeletons>
      <mz-spinner [active]="true" size="large" [overlay]="true" [showLabel]="true" label="جارٍ تحميل بيانات السهم..."></mz-spinner>
    </div>

    <div *ngIf="!loading && !marketData" class="empty-state">
      <h3>لم يتم العثور على بيانات لهذا السهم</h3>
      <a routerLink="/stocks" class="text-link">العودة إلى قائمة الأسهم</a>
    </div>

    <div *ngIf="!loading && marketData">
      <!-- Back Link -->
      <mz-back-link [to]="'/stocks'" label="العودة إلى الأسهم"></mz-back-link>

      <!-- Detail Hero Header Card -->
      <mz-details-header-card
        [title]="marketData.nameAr || marketData.ticker"
        [code]="marketData.ticker"
        [secondaryName]="marketData.nameEn"
        [favoriteSymbol]="marketData.ticker"
        [tags]="headerTags"
        [priceLabel]="marketData.hasMarketData !== false ? 'سعر الإغلاق الأخير' : 'بيانات التداول والسوق'"
        [price]="marketData.hasMarketData !== false ? (marketData.closingPrice != null ? (marketData.closingPrice | number:'1.2-2') : '—') : 'غير متداولة'"
        [currency]="marketData.hasMarketData !== false ? currencyLabel : ''"
        [changeText]="supportResistance?.changePct != null ? ((supportResistance?.changePct ?? 0) > 0 ? '+' : '') + (supportResistance?.changePct | number:'1.2-2') + '%' : null"
        [changeTone]="(supportResistance?.changePct ?? 0) >= 0 ? 'positive' : 'negative'">
      </mz-details-header-card>

      <!-- Detail Grid: Support/Resistance + Fair Value (Only if stock has market data) -->
      <div class="mz-details-two" *ngIf="marketData.hasMarketData !== false" style="margin: 20px 0;">
        <!-- Support & Resistance Ladder -->
        <mz-support-resistance-card
          eyebrow="قراءة فنية"
          title="الدعم والمقاومة والارتكاز"
          [pivotLabel]="supportResistance ? 'الارتكاز: ' + (supportResistance.pivot != null ? (supportResistance.pivot | number:'1.2-2') : '—') + ' ' + currencyLabel : null"
          [note]="supportResistanceOutOfRangeNote || 'تحسب نقاط الارتكاز الفنية يومياً بناءً على أعلى وأدنى سعر وسعر الإغلاق لجلسة التداول السابقة.'"
          [points]="srPoints"
          [markerPos]="supportResistanceMarkerPosition"
          [markerLabel]="'السعر ' + (currentStockPrice != null ? (currentStockPrice | number:'1.2-2') : '')"
          emptyText="بيانات الدعم والمقاومة غير متوفرة حالياً لهذا السهم.">
        </mz-support-resistance-card>

        <!-- Fair Value Card (Graham formula only) -->
        <mz-fair-value-card
          eyebrow="نموذج جراهام (Graham Formula)"
          title="القيمة العادلة"
          [unavailable]="isFairValueUnavailable"
          unavailableTitle="بيانات غير كافية لحساب القيمة العادلة (نموذج جراهام)"
          unavailableText="لا توجد حالياً بيانات كافية لنموذج جراهام (ربحية EPS، قيمة دفترية BookValue، أو سعر السهم الحالي غير متاح). لن تُعرض قيمة عادلة رقمية أو نسبة ثقة حتى توفّر هذه البيانات."
          [value]="(marketData.fairValue | number:'1.2-2') || '—'"
          [currency]="currencyLabel"
          [gapText]="fairValueGapText"
          [gapTone]="fairValueSignal === 'cheap' ? 'positive' : (fairValueSignal === 'expensive' ? 'negative' : 'muted')"
          [formulaNote]="'نموذج جراهام: √(22.5 × EPS × BookValue) · مستوى الثقة: ' + getConfidenceLabel(marketData.valuationConfidence)"
          [methods]="fairValueMethodsList">
          <app-comparison-badge badge [comparison]="fairValueComparison"></app-comparison-badge>
        </mz-fair-value-card>
      </div>

      <!-- Shariah Opinions Grid: Multi-source evaluators -->
      <mz-sharia-authorities-section
        *ngIf="!isActivityNonCompliant"
        appReveal
        style="margin: 20px 0;"
        [eyebrow]="isShariahBoardFrozen || marketData.hasShariahBoard ? 'الإشراف الشرعي' : 'تغطية الجهات الشرعية'"
        [title]="isShariahBoardFrozen || marketData.hasShariahBoard ? 'الإشراف الشرعي للسهم' : 'آراء الهيئات الشرعية (7 مصادر مستقلة)'"
        [summaryText]="shariaSummaryText"
        [summaryNote]="shariaSummaryNote"
        [summaryTone]="shariaSummaryTone"
        [authorities]="shariaAuthoritiesList"
        [ratiosTitle]="shouldShowRatiosSection ? 'المعايير والنسب المالية الشرعية التفصيلية' : ''"
        [ratiosMeta]="shariaRatiosMetaText"
        [shariaRatios]="detailedShariaRatiosList"
        (authorityAction)="onAuthorityAction($event)">
        <!-- Fallback note if ratios unavailable -->
        <p *ngIf="shouldShowRatiosSection && !hasShariahMetricsData" class="mz-authority-note" style="margin-top:12px">
          Data currently unavailable — لا توجد حالياً بيانات النسب المالية الشرعية لهذا السهم.
        </p>
      </mz-sharia-authorities-section>

      <!-- Activity hard gate -->
      <mz-details-section
        *ngIf="isActivityNonCompliant"
        appReveal
        style="margin: 20px 0;"
        eyebrow="حُكم النشاط"
        [title]="'غير متوافق مع الشريعة — النشاط: ' + activityClassificationLabel">
        <p class="mz-authority-note">
          Non-compliant due to the nature of its core business; financial screens are not applied.
        </p>
        <p class="mz-authority-note">
          يستبعد السهم بوابة النشاط ذاتها، ولذلك لا تُعرض النسب المالية الشرعية ولا آراء الهيئات الشرعية.
        </p>
      </mz-details-section>

      <!-- Quantitative standards dialog (Bourse Halal card 'عرض التفاصيل') -->
      <div class="standards-dialog-backdrop" *ngIf="showStandardsDialog" [class.closing]="dialogClosing" (click)="onStandardsBackdropClick($event)">
        <div class="standards-dialog" role="dialog" aria-modal="true" aria-labelledby="std-dialog-title"
             tabindex="-1" (keydown)="onStandardsDialogKeydown($event)">
          <div class="standards-dialog-head">
            <div>
              <span class="eyebrow">الفحص الكمي الشرعي</span>
              <h2 id="std-dialog-title">تفاصيل المطابقة للمعايير الشرعية</h2>
            </div>
            <button type="button" class="standards-dialog-close" (click)="closeStandardsDialog()" aria-label="إغلاق">
              <lucide-icon [img]="XIcon" size="18"></lucide-icon>
            </button>
          </div>

          <p class="standards-summary" [class.pass]="dialogTotalPassed > 0" [class.fail]="dialogTotalPassed === 0">
            اجتاز {{ dialogTotalPassed }} من {{ dialogTotalCount }} معايير
          </p>

          <div class="std-block" *ngFor="let ev of dialogMainCriteria">
            <div class="std-block-head">
              <span class="std-verdict" [class.pass]="ev.passed" [class.fail]="!ev.passed">
                <lucide-icon [img]="ev.passed ? CheckIcon : XIcon" size="14"></lucide-icon>
              </span>
              <div class="std-block-title">
                <strong>{{ ev.nameAr }}</strong>
                <span class="std-en">{{ ev.nameEn }}</span>
              </div>
            </div>
            <div class="criterion-row" *ngFor="let r of ev.ratios">
              <span class="criterion-name">{{ getCriterionLabelAr(r.key) }}</span>
              <span class="criterion-values">
                <ng-container *ngIf="r.hasData; else noCriterionData">
                  {{ r.value | number:'1.0-2' }}% / ≤ {{ r.max }}%
                </ng-container>
                <ng-template #noCriterionData>—</ng-template>
              </span>
              <span class="criterion-mark"
                    [class.pass]="r.hasData && r.passed"
                    [class.fail]="r.hasData && !r.passed"
                    [class.nodata]="!r.hasData">
                <lucide-icon *ngIf="r.hasData && r.passed" [img]="CheckIcon" size="14"></lucide-icon>
                <lucide-icon *ngIf="r.hasData && !r.passed" [img]="XIcon" size="14"></lucide-icon>
                <lucide-icon *ngIf="!r.hasData" [img]="MinusIcon" size="14"></lucide-icon>
              </span>
            </div>
          </div>

          <!-- Individual scholars row: debt ≤ 50% with — for the other ratios; pass follows the combined rule. -->
          <div class="std-block scholars-block" *ngIf="dialogScholarsCriterion">
            <div class="std-block-head">
              <span class="std-verdict" [class.pass]="dialogScholarsCriterion.passed" [class.fail]="!dialogScholarsCriterion.passed" [class.nodata]="!dialogScholarsCriterion.hasData">
                <lucide-icon *ngIf="dialogScholarsCriterion.passed" [img]="CheckIcon" size="14"></lucide-icon>
                <lucide-icon *ngIf="!dialogScholarsCriterion.passed && dialogScholarsCriterion.hasData" [img]="XIcon" size="14"></lucide-icon>
                <lucide-icon *ngIf="!dialogScholarsCriterion.hasData" [img]="MinusIcon" size="14"></lucide-icon>
              </span>
              <div class="std-block-title">
                <strong>{{ scholarsStandardNameAr }}</strong>
                <span class="std-en">{{ scholarsStandardNameEn }}</span>
              </div>
            </div>
            <div class="criterion-row" *ngFor="let r of dialogScholarsCriterion.ratios">
              <span class="criterion-name">{{ getCriterionLabelAr(r.key) }}</span>
              <span class="criterion-values">
                <ng-container *ngIf="r.hasData; else noScholarsData">
                  {{ r.value | number:'1.0-2' }}% / ≤ {{ r.max }}%
                </ng-container>
                <ng-template #noScholarsData>—</ng-template>
              </span>
              <span class="criterion-mark"
                    [class.pass]="r.hasData && r.passed"
                    [class.fail]="r.hasData && !r.passed"
                    [class.nodata]="!r.hasData">
                <lucide-icon *ngIf="r.hasData && r.passed" [img]="CheckIcon" size="14"></lucide-icon>
                <lucide-icon *ngIf="r.hasData && !r.passed" [img]="XIcon" size="14"></lucide-icon>
                <lucide-icon *ngIf="!r.hasData" [img]="MinusIcon" size="14"></lucide-icon>
              </span>
            </div>
          </div>

          <p class="upgrade-note" *ngIf="viaScholarsOnly" style="margin-top: 12px;">
            <lucide-icon [img]="InfoIcon" size="13"></lucide-icon>
            <span>متوافق وفق فتاوى بعض العلماء الأفراد فقط (نسبة القروض {{ loansPct | number:'1.0-2' }}% ≤ 50%)</span>
          </p>

          <p class="muted standards-dialog-foot">الفحص كمي فقط، ولا يزال الفحص النوعي لنشاط الشركة مطلوبًا</p>
        </div>
      </div>

      <!-- Market Data Fundamentals -->
      <mz-market-indicators-section
        *ngIf="marketData.hasMarketData !== false"
        appReveal
        style="margin: 20px 0;"
        eyebrow="بيانات التداول والقوائم"
        title="مؤشرات السوق المالية"
        [items]="marketIndicatorsList">
        <span action class="mz-authority-meta">{{ getSourceText(marketData.sourceLastUpdateText) }}</span>
      </mz-market-indicators-section>
    </div>
  `
})
export class StockDetailComponent implements OnInit, OnDestroy {
  readonly ArrowLeftIcon = ArrowLeft;
  readonly BookOpenIcon = BookOpen;
  readonly FileTextIcon = FileText;
  readonly InfoIcon = Info;

  ticker = '';
  marketData?: MarketDataDto | null;
  supportResistance?: SupportResistanceDto | null;
  loading = true;

  /** Quantitative-standards dialog state (Bourse Halal card). */
  showStandardsDialog = false;
  dialogClosing = false;
  private standardsDialogTrigger: HTMLElement | null = null;
  private dialogCloseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly MinusIcon = Minus;
  readonly criterionOrder: readonly ShariahCriterionKey[] = CRITERION_ORDER;
  readonly criterionLabels = CRITERION_LABELS;

  getCriterionLabelAr(key: string): string {
    return (this.criterionLabels as Record<string, { ar: string; en: string }>)[key]?.ar || key;
  }

  /** Scholars criterion constants exposed to the template. */
  readonly scholarsStandardNameAr = SCHOLARS_STANDARD_NAME_AR;
  readonly scholarsStandardNameEn = SCHOLARS_STANDARD_NAME_EN;
  readonly scholarsMaxDebt = scholarsDebtMax;

  /** Single source of truth ticker freeze list (also imported from models) */
  readonly frozenShariahTickers = SHARIAH_BOARD_FROZEN_TICKERS;

  /**
   * Permanent display-layer override:
   * If ticker is in SHARIAH_BOARD_FROZEN_TICKERS (ADIB, SAUD, FAIT, FAITA, ATLC, AMIA),
   * the display skips normal resolution/rendering of the 7-source grid and AAOIFI & S&P ratio panel,
   * rendering only the green "يوجد لجنة شرعية" badge.
   */
  get isShariahBoardFrozen(): boolean {
    const raw = (this.ticker || this.marketData?.ticker || '').trim().toUpperCase();
    return this.frozenShariahTickers.includes(raw);
  }


  sectors: SectorSummaryDto[] = [];

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private host: ElementRef<HTMLElement>,
    private cache: SessionCacheService
  ) { }

  ngOnInit(): void {
    this.loadSectors();
    this.route.paramMap.subscribe((params) => {
      this.ticker = params.get('code') || '';
      if (this.ticker) {
        this.loadStockData();
      }
    });
  }

  private loadSectors(): void {
    const cacheKey = 'all_sectors_summary';
    const cached = this.cache.get<SectorSummaryDto[]>(cacheKey);
    if (cached) {
      this.sectors = cached.data;
      if (!this.cache.isStale(cacheKey)) return;
    }
    this.api.getSectors().subscribe({
      next: (sectors) => {
        this.sectors = sectors || [];
        this.cache.set(cacheKey, this.sectors);
      },
      error: () => {
        if (!cached) this.sectors = [];
      }
    });
  }

  ngOnDestroy(): void {
    // Never leave the page scroll locked if navigation happens with the dialog open.
    document.body.style.overflow = '';
    if (this.dialogCloseTimer !== null) {
      clearTimeout(this.dialogCloseTimer);
      this.dialogCloseTimer = null;
    }
  }

  loadStockData(): void {
    const cacheKeyMarket = `stock_market_${this.ticker}`;
    const cacheKeySr = `stock_sr_${this.ticker}`;
    const cachedMarket = this.cache.get<MarketDataDto>(cacheKeyMarket);
    const cachedSr = this.cache.get<SupportResistanceDto>(cacheKeySr);

    if (cachedMarket) {
      this.marketData = cachedMarket.data;
      if (cachedSr) this.supportResistance = cachedSr.data;
      this.loading = false;
      if (!this.cache.isStale(cacheKeyMarket)) {
        return;
      }
    } else {
      this.loading = true;
    }

    this.api.getMarketData(this.ticker).subscribe({
      next: (data) => {
        this.cache.set(cacheKeyMarket, data);
        this.marketData = data;
        this.loading = false;
      },
      error: () => {
        if (!cachedMarket) {
          this.marketData = null;
          this.loading = false;
        }
      }
    });

    this.api.getSupportResistance(this.ticker).subscribe({
      next: (sr) => {
        this.cache.set(cacheKeySr, sr);
        this.supportResistance = sr;
      },
      error: () => {
        if (!cachedSr) {
          this.supportResistance = null;
        }
      }
    });
  }

  /** The 7 independent boards, in display order. */
  private readonly allSourceKeys: number[] = [
    ShariahSourceKey.HalalBourse,
    ShariahSourceKey.Musaffa,
    ShariahSourceKey.Kashif,
    ShariahSourceKey.HalalInvest,
    ShariahSourceKey.FaisalBank,
    ShariahSourceKey.Ostoul,
    ShariahSourceKey.Thndr
  ];

  // ── Stored verdicts (single source of truth) ─────────────────────────
  // The backend computes verdicts once via the shared service and persists them:
  // the Halal Bourse source verdict (halalStatus + ViaScholarsOnly +
  // VerdictDetailsJson, quantitative only) and the OVERALL internal verdict
  // (shariahStatus + verdictSource: boards + EGX33 + stored Halal aggregated).
  // This page READS them directly: no client-side recomputation. Doubtful/مشكوك
  // never renders (sanitized to no-opinion upstream). Raw Halal values never count.

  /** Overall internal verdict (الحكم الداخلي المعتمد) from the API. Pending = البيانات غير كافية. */
  get internalVerdict(): string | null {
    return this.marketData?.shariahStatus ?? null;
  }

  /** Halal Bourse source's OWN stored verdict (Compliant/NonCompliant/Pending). */
  get halalVerdict(): string | null {
    return this.marketData?.halalStatus ?? null;
  }

  /** True when the Halal ratio evaluation is Insufficient (ratios missing). */
  get isHalalInsufficient(): boolean {
    const s = this.normalizeShariahStatus(this.halalVerdict);
    return s === 'pending' || s === '' || this.halalVerdict == null;
  }

  /** True when the stored verdict is Compliant ONLY via the scholars rule (green everywhere; note only here). */
  get viaScholarsOnly(): boolean {
    return !!this.marketData?.viaScholarsOnly;
  }

  /** Purification % shows only for compliant stocks where it applies — never for non-compliant/insufficient. */
  get showPurificationPct(): boolean {
    if (!this.isCompliant(this.internalVerdict)) return false;
    const v = this.marketData?.shariahPct;
    return v !== null && v !== undefined;
  }

  /** Scholars clarification as small secondary text in the header — detail page only. */
  get showScholarsHeaderNote(): boolean {
    return this.isCompliant(this.internalVerdict) && this.viaScholarsOnly;
  }

  /** Opinions-fallback note in the header — detail page only, when other sources
      decided because ratios are missing. */
  get showFallbackHeaderNote(): boolean {
    return this.isCompliant(this.internalVerdict)
      && this.isHalalInsufficient
      && (this.marketData?.verdictSource ?? null) === 'BoardsFallback';
  }

  /** Scholars note inside the Halal Bourse card — detail page only. */
  get showScholarsCardNote(): boolean {
    return this.showScholarsHeaderNote;
  }

  /** Details button + dialog belong to the Halal Bourse card: only when ratios are sufficient. */
  get showDetailsButton(): boolean {
    return !this.isHalalInsufficient;
  }

  /** Insufficient message naming the missing ratio(s). */
  get insufficientMessage(): string {
    const missing: string[] = [];
    if (this.loansPct == null) missing.push('نسبة القروض والفوائد');
    if (this.spHaramPct == null) missing.push('نسبة الإيراد المحرم');
    const what = missing.length ? missing.join(' و') : 'النسب المالية';
    return `البيانات غير كافية للحكم على هذا السهم (${what})`;
  }

  /** Parsed stored per-criterion details (6 criteria). Null when the row predates the backfill. */
  private get storedVerdict(): { passedCount: number; totalCount: number; viaScholarsOnly: boolean; criteria: Array<{ id: string; nameEn: string; passed: boolean; hasData: boolean; ratios: Array<{ key: string; value: number | null; max: number; hasData: boolean; passed: boolean }> }> } | null {
    const raw = (this.marketData as unknown as { verdictDetailsJson?: string | null })?.verdictDetailsJson;
    if (!raw) return null;
    try {
      const o = JSON.parse(raw);
      const rawCriteria = (o?.criteria || o?.Criteria);
      if (!o || !Array.isArray(rawCriteria)) return null;
      return {
        passedCount: Number(o.passedCount ?? o.PassedCount ?? 0),
        totalCount: Number(o.totalCount ?? o.TotalCount ?? 6),
        viaScholarsOnly: !!(o.viaScholarsOnly ?? o.ViaScholarsOnly),
        criteria: rawCriteria.map((c: any) => ({
          id: String(c.id ?? c.Id ?? ''),
          nameEn: String(c.nameEn ?? c.NameEn ?? ''),
          passed: !!(c.passed ?? c.Passed),
          hasData: !!(c.hasData ?? c.HasData),
          ratios: Array.isArray(c.ratios ?? c.Ratios) ? (c.ratios ?? c.Ratios).map((r: any) => ({
            key: String(r.key ?? r.Key ?? ''),
            value: (r.value ?? r.Value) != null ? Number(r.value ?? r.Value) : null,
            max: Number(r.max ?? r.Max ?? 0),
            hasData: !!(r.hasData ?? r.HasData),
            passed: !!(r.passed ?? r.Passed)
          })) : []
        }))
      };
    } catch { return null; }
  }

  private get storedCriterionNameAr(): Record<string, string> {
    return {
      egx33: 'مؤشر EGX 33 للشريعة',
      dfm: 'سوق دبي المالي',
      aaoifi: 'أيوفي (هيئة المحاسبة والمراجعة للمؤسسات المالية الإسلامية)',
      sp: 'إس آند بي للشريعة',
      klsi: 'مؤشر كوالالمبور للشريعة',
      scholars: this.scholarsStandardNameAr
    };
  }

  private get storedCriterionNameEn(): Record<string, string> {
    return {
      egx33: 'EGX 33',
      dfm: 'DFM',
      aaoifi: 'AAOIFI',
      sp: 'S&P Shariah',
      klsi: 'KLSI',
      scholars: this.scholarsStandardNameEn
    };
  }

  /** First 5 (main) criteria for the dialog, from stored details. */
  get dialogMainCriteria(): Array<{ nameAr: string; nameEn: string; passed: boolean; hasData: boolean; ratios: Array<{ key: string; value: number | null; max: number; hasData: boolean; passed: boolean }> }> {
    const s = this.storedVerdict;
    if (!s) return [];
    return s.criteria.filter((x) => x.id !== 'scholars').map((x) => ({
      nameAr: this.storedCriterionNameAr[x.id] || x.nameEn,
      nameEn: this.storedCriterionNameEn[x.id] || x.nameEn,
      passed: !!x.passed,
      hasData: !!x.hasData,
      ratios: x.ratios || []
    }));
  }

  /** Scholars criterion for the dialog (debt ≤ 50% with — for others; combined pass). */
  get dialogScholarsCriterion(): { passed: boolean; hasData: boolean; ratios: Array<{ key: string; value: number | null; max: number; hasData: boolean; passed: boolean }> } | null {
    const s = this.storedVerdict;
    if (!s) return null;
    const x = s.criteria.find((y) => y.id === 'scholars');
    if (!x) return null;
    return {
      passed: !!x.passed,
      hasData: !!x.hasData,
      ratios: x.ratios || []
    };
  }

  /** Top banner: stored counts (اجتاز X من 6). Green when ≥1 passed, red when none. */
  get dialogTotalPassed(): number {
    return this.storedVerdict?.passedCount ?? 0;
  }

  get dialogTotalCount(): number {
    return this.storedVerdict?.totalCount ?? 6;
  }

  /**
   * Computed note for Halal Bourse card according to stored verdict:
   * - Compliant via main standard: "اجتاز X من 6 معايير"
   * - Compliant via scholars rule only: "متوافق وفق فتاوى بعض العلماء الأفراد فقط (نسبة القروض X% ≤ 50%)"
   * - NonCompliant: "لم يجتز أي معيار من الستة"
   * - Insufficient: insufficientMessage
   */
  get halalCardNote(): string {
    const s = this.normalizeShariahStatus(this.halalVerdict);
    if (s === 'compliant') {
      if (this.viaScholarsOnly) {
        const debtStr = this.loansPct != null ? `${parseFloat(Number(this.loansPct).toFixed(2))}%` : '';
        return `متوافق وفق فتاوى بعض العلماء الأفراد فقط (نسبة القروض ${debtStr} ≤ 50%)`;
      }
      return `اجتاز ${this.dialogTotalPassed} من 6 معايير`;
    }
    if (s === 'noncompliant') {
      return 'لم يجتز أي معيار من الستة';
    }
    return this.insufficientMessage;
  }

  /**
   * One card per board. Halal Bourse carries its OWN stored verdict (halalStatus);
   * other boards carry their raw opinion (doubtful sanitized to no-opinion).
   * Halal Insufficient renders as a neutral البيانات غير كافية card (a real card,
   * not "no opinion") carrying the missing-ratio message; it is excluded from the
   * counter denominator via recordedOpinions.
   */
  get sourceOpinionsList(): EffectiveOpinionView[] {
    const existing = this.marketData?.shariahOpinions || [];
    const map = new Map<number, ShariahSourceOpinionDto>();
    for (const op of existing) {
      const key = Number(op.sourceKey);
      if (!Number.isNaN(key)) map.set(key, op);
    }
    return this.allSourceKeys.map((key) => {
      const real = map.get(key);
      const isHalal = Number(key) === ShariahSourceKey.HalalBourse;
      if (isHalal) {
        // Halal's OWN stored verdict only — raw source values never count.
        const s = this.normalizeShariahStatus(this.halalVerdict);
        const cardNote = this.halalCardNote;
        if (s === 'compliant') return { sourceKey: key, status: 'Compliant', percentage: null, note: cardNote, noOpinion: false, rawDisplayStatus: 'Compliant', effectiveStatus: 'Compliant', upgraded: this.viaScholarsOnly };
        if (s === 'noncompliant') return { sourceKey: key, status: 'NonCompliant', percentage: null, note: cardNote, noOpinion: false, rawDisplayStatus: 'NonCompliant', effectiveStatus: 'NonCompliant', upgraded: false };
        // Insufficient -> neutral البيانات غير كافية card (excluded from the counter).
        return { sourceKey: key, status: 'Pending', percentage: null, note: cardNote, noOpinion: false, rawDisplayStatus: 'Pending', effectiveStatus: 'Pending', upgraded: false };
      }
      if (real && (real.status || '').trim() && this.normalizeShariahStatus(real.status) !== 'doubtful' && !(real.status || '').includes('مشكوك')) {
        const st = real.status;
        return { ...real, noOpinion: false, rawDisplayStatus: st ?? null, effectiveStatus: st ?? null, upgraded: false };
      }
      return { sourceKey: key, status: null, percentage: null, note: null, noOpinion: true, rawDisplayStatus: null, effectiveStatus: null, upgraded: false };
    });
  }

  /** Boards with a raw recorded opinion (Halal uses its OWN stored verdict:
      sufficient => recorded, insufficient => no opinion recorded, excluded from X and N). */
  get recordedOpinions(): ShariahSourceOpinionDto[] {
    const raws = (this.marketData?.shariahOpinions || []).filter(
      (o) => !!(o.status || '').trim() && this.normalizeShariahStatus(o.status) !== 'doubtful' && !(o.status || '').includes('مشكوك') && Number(o.sourceKey) !== ShariahSourceKey.HalalBourse
    );
    // Halal Bourse entry: sufficient => counts as recorded (compliant or not);
    // insufficient => no opinion recorded (excluded from X and N).
    if (!this.isHalalInsufficient) {
      raws.push({ sourceKey: ShariahSourceKey.HalalBourse, status: this.isCompliant(this.halalVerdict) ? 'Compliant' : 'NonCompliant' });
    }
    return raws;
  }

  /**
   * Single helper that normalizes every Shariah status value exactly once.
   * Doubtful is recognized but never displayed (mapped to insufficient upstream).
   */
  normalizeShariahStatus(status?: string | null): 'compliant' | 'noncompliant' | 'doubtful' | 'pending' | 'blocked' | '' {
    return normalizeStatusValue(status);
  }

  /** Halal uses stored verdict: compliant (incl. via scholars) counts; insufficient excludes. */
  get compliantSourcesCount(): number {
    return this.sourceOpinionsList.filter(
      (o) => !o.noOpinion && this.normalizeShariahStatus(o.effectiveStatus) === 'compliant'
    ).length;
  }

  /** Aggregate denominator: recorded opinions (Halal insufficient excluded) — not a fixed 7. */
  get totalAvailableSourcesCount(): number {
    return this.recordedOpinions.length;
  }

  get noOpinionSourcesCount(): number {
    return Math.max(0, this.allSourceKeys.length - this.totalAvailableSourcesCount);
  }

  /** (compliant opinions) / (boards with any recorded opinion); null when none recorded. */
  get compliancePercent(): number | null {
    if (this.totalAvailableSourcesCount === 0) return null;
    return Math.round((this.compliantSourcesCount / this.totalAvailableSourcesCount) * 100);
  }

  /** SourceKeys 5 (FaisalBank) and 6 (Ostoul) come from the manual JSON import, verdict-only. */
  isManualSource(op: ShariahSourceOpinionView): boolean {
    return op.sourceKey === 5 || op.sourceKey === 6;
  }

  /**
   * Absolute backend URL for this opinion's stored PDF (or null). Goes through
   * the shared ApiService helper so the link always hits the backend file
   * route instead of the frontend SPA catch-all.
   */
  pdfUrlFor(op: ShariahSourceOpinionView): string | null {
    if (!op.pdfUrl) return null;
    return this.api.sourcePdfUrlFor(op.sourceKey);
  }

  isCompliant(status?: string | null): boolean {
    return this.normalizeShariahStatus(status) === 'compliant';
  }

  /** Doubtful never renders anywhere — always false (kept for template compat). */
  isDoubtful(_status?: string | null): boolean {
    return false;
  }

  isNonCompliant(status?: string | null): boolean {
    return this.normalizeShariahStatus(status) === 'noncompliant';
  }

  isHalalBourseCard(op: ShariahSourceOpinionView): boolean {
    return Number(op.sourceKey) === ShariahSourceKey.HalalBourse;
  }

  /**
   * Display status for an opinion card — Halal reads the stored verdict,
   * others read raw. No caller reads the raw Halal status.
   */
  getCardStatus(op: EffectiveOpinionView): string | null {
    return op.effectiveStatus ?? null;
  }

  /**
   * Stable identity for opinion cards. sourceOpinionsList is a getter that
   * builds a fresh array every change-detection cycle; without trackBy,
   * Angular would destroy/recreate every card (replaying its entrance
   * animation) whenever any unrelated async event fires.
   */
  trackOpinionByKey(_index: number, op: EffectiveOpinionView): number {
    return Number(op.sourceKey);
  }

  openStandardsDialog(event?: Event): void {
    this.standardsDialogTrigger = (event?.currentTarget as HTMLElement | null) ?? null;
    if (this.dialogCloseTimer !== null) {
      clearTimeout(this.dialogCloseTimer);
      this.dialogCloseTimer = null;
    }
    this.dialogClosing = false;
    this.showStandardsDialog = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      this.host.nativeElement.querySelector<HTMLElement>('.standards-dialog')?.focus();
    }, 0);
  }

  closeStandardsDialog(): void {
    if (!this.showStandardsDialog || this.dialogClosing) return;
    // Play the fade/scale-out animation before detaching the dialog.
    this.dialogClosing = true;
    this.dialogCloseTimer = setTimeout(() => {
      this.showStandardsDialog = false;
      this.dialogClosing = false;
      this.dialogCloseTimer = null;
      document.body.style.overflow = '';
      this.standardsDialogTrigger?.focus();
      this.standardsDialogTrigger = null;
    }, 180);
  }

  onStandardsBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('standards-dialog-backdrop')) {
      this.closeStandardsDialog();
    }
  }

  /** ESC closes; Tab cycles inside the dialog (focus trap). */
  onStandardsDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.closeStandardsDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = this.host.nativeElement.querySelector<HTMLElement>('.standards-dialog');
    if (!dialog) return;
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
    if (!focusables.length) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && (active === first || !dialog.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  getVerdictLabel(status?: string | null): string {
    const s = this.normalizeShariahStatus(status);
    if (s === 'compliant' || status === 'متوافق') return 'متوافق';
    if (s === 'noncompliant' || status === 'غير متوافق') return 'غير متوافق';
    // Insufficient (old Pending/قيد المراجعة) and doubtful/مشكوك never display as amber.
    if (s === 'pending' || s === 'doubtful' || (status || '').includes('مشكوك')) return 'البيانات غير كافية';
    return status || 'غير محدد';
  }

  getSourceName(key: number): string {
    return SHARIAH_SOURCE_NAMES[key]?.ar || `جهة شرعية #${key}`;
  }

  /** True if the stock is a constituent of the EGX33 Shariah index (Index code = 'EGX 33'). */
  get isEGX33Constituent(): boolean {
    return this.marketData?.indices?.some(i => i.code === 'EGX 33') ?? false;
  }

  getMethodDisplayName(name: string): string {
    const n = name.trim();
    if (n === 'Graham') return 'نموذج جراهام (Graham Formula)';
    if (n === 'PEG' || n === 'PEG_Ratio' || n.includes('PEG')) return 'مكرر الربحية إلى النمو (PEG Ratio Valuation)';
    if (n === 'BookValue') return 'القيمة الدفترية المباشرة (Book Value)';
    return name;
  }

  getConfidenceLabel(level?: string | null): string {
    const l = (level || '').toLowerCase();
    if (l === 'high') return 'عالي (3 معادلات متوافقة فأكثر)';
    if (l === 'medium') return 'متوسط (معادلتان متوافقتان)';
    if (l === 'low') return 'منخفض (معادلة واحدة متوافقة)';
    return 'غير محدد (0 معادلات)';
  }

  /**
   * True when there is no trustworthy fair value for this stock: no fair-value row at all
   * (priceComparison null), an explicit 'Unavailable' comparison, zero approved methods,
   * Confidence 'None', or a missing/zero fairValue. The card then shows
   * "بيانات غير كافية لحساب القيمة العادلة" instead of a fabricated
   * "قريبة من العادلة — 0.00 ج.م" verdict.
   */
  get isFairValueUnavailable(): boolean {
    const md = this.marketData;
    if (!md) return true;
    if (!md.fairValue) return true;

    const cmp = (md.priceComparison || '').trim().toLowerCase();
    if (!cmp || cmp === 'unavailable') return true;
    if (md.methodsUsedCount === 0) return true;
    if ((md.valuationConfidence || '').trim().toLowerCase() === 'none') return true;

    return false;
  }

  /**
   * Single helper for the Fair Value card verdict: the badge, the percentage
   * sign/wording and the color ALL derive from here, so they can never
   * contradict each other. Convention (matches the API's ComputePremium):
   * 'expensive' = price above fair value (positive premium, red),
   * 'cheap' = price below fair value (negative premium, green),
   * 'fair' = within ±2% (neutral), anything else = 'unavailable' (N/A).
   */
  get fairValueSignal(): 'cheap' | 'expensive' | 'fair' | 'unavailable' {
    const c = (this.marketData?.priceComparison || '').trim().toLowerCase();
    if (c === 'cheap') return 'cheap';
    if (c === 'expensive') return 'expensive';
    if (c === 'fair') return 'fair';
    return 'unavailable';
  }

  /** Canonical comparison string fed to the badge — always agrees with the signal. */
  get fairValueComparison(): string {
    switch (this.fairValueSignal) {
      case 'cheap': return 'Cheap';
      case 'expensive': return 'Expensive';
      case 'fair': return 'Fair';
      default: return 'Unavailable';
    }
  }

  /** Premium % from the API: (price − fairValue) / fairValue × 100; null → show N/A. */
  get fairValuePremiumPct(): number | null {
    const v = this.marketData?.fairValueDiffPct;
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  /** Magnitude of the premium (for "below fair value" wording, shown unsigned). */
  get fairValuePremiumAbs(): number | null {
    const p = this.fairValuePremiumPct;
    return p === null ? null : Math.abs(p);
  }

  /** Upside when price is below fair value: (fair / price - 1) * 100; null when not computable. */
  get fairValueUpsidePct(): number | null {
    const price = this.marketData?.closingPrice;
    const fair = this.marketData?.fairValue;
    if (price === null || price === undefined || fair === null || fair === undefined) return null;
    const p = Number(price);
    const f = Number(fair);
    if (isNaN(p) || isNaN(f) || p <= 0 || f <= 0) return null;
    return (f / p - 1) * 100;
  }

  /** Fair-to-price multiple for the below-fair case: fair / price (e.g. 4.2x); null when not computable. */
  get fairValueUpsideMultiple(): number | null {
    const price = this.marketData?.closingPrice;
    const fair = this.marketData?.fairValue;
    if (price === null || price === undefined || fair === null || fair === undefined) return null;
    const p = Number(price);
    const f = Number(fair);
    if (isNaN(p) || isNaN(f) || p <= 0 || f <= 0) return null;
    return f / p;
  }

  /** Price as a multiple of fair value (e.g. 8.3x); null when not computable. */
  get fairValueMultiple(): number | null {
    const price = this.marketData?.closingPrice;
    const fair = this.marketData?.fairValue;
    if (price === null || price === undefined || fair === null || fair === undefined) return null;
    const p = Number(price);
    const f = Number(fair);
    if (isNaN(p) || isNaN(f) || p <= 0 || f <= 0) return null;
    return p / f;
  }

  /** Show the multiple hint only for large gaps (above 100%). */
  get showFairValueMultiple(): boolean {
    const p = this.fairValuePremiumPct;
    return p !== null && Math.abs(p) > 100 && this.fairValueMultiple !== null;
  }

  get aaoifiHaramPerShare(): number | null {
    return this.marketData?.shariahMetrics?.aaoifiHaramEarningPerShare ?? null;
  }

  get spHaramPct(): number | null {
    return this.marketData?.shariahMetrics?.spHaramEarningPercentage
      ?? this.marketData?.shariahPct
      ?? null;
  }

  get loansPct(): number | null {
    const m = this.marketData?.shariahMetrics;
    return m?.loansPercentage ?? m?.interestBearingDebtRatio ?? null;
  }



  get currentStockPrice(): number | null {
    if (this.marketData?.closingPrice !== undefined && this.marketData?.closingPrice !== null) {
      return Number(this.marketData.closingPrice);
    }
    if (this.supportResistance?.lastPrice !== undefined && this.supportResistance?.lastPrice !== null) {
      return Number(this.supportResistance.lastPrice);
    }
    return null;
  }

  get supportResistanceMarkerPosition(): number | null {
    const price = this.currentStockPrice;
    if (price === null || !this.supportResistance) return null;

    const s2 = this.supportResistance.s2;
    const s1 = this.supportResistance.s1;
    const pivot = this.supportResistance.pivot;
    const r1 = this.supportResistance.r1;
    const r2 = this.supportResistance.r2;

    if (s2 == null || s1 == null || pivot == null || r1 == null || r2 == null) {
      return null;
    }

    // Out of range check: do NOT plot on ladder if outside [S2, R2]
    if (price < s2 || price > r2) {
      return null;
    }

    // Proportional interpolation between adjacent levels
    // Positions in RTL: S2 at 5%, S1 at 27.5%, Pivot at 50%, R1 at 72.5%, R2 at 95%
    if (price <= s1) {
      const denom = s1 - s2;
      const ratio = denom > 0 ? (price - s2) / denom : 0;
      return 5 + ratio * 22.5;
    } else if (price <= pivot) {
      const denom = pivot - s1;
      const ratio = denom > 0 ? (price - s1) / denom : 0;
      return 27.5 + ratio * 22.5;
    } else if (price <= r1) {
      const denom = r1 - pivot;
      const ratio = denom > 0 ? (price - pivot) / denom : 0;
      return 50 + ratio * 22.5;
    } else {
      const denom = r2 - r1;
      const ratio = denom > 0 ? (price - r1) / denom : 0;
      return 72.5 + ratio * 22.5;
    }
  }

  get supportResistanceOutOfRangeNote(): string | null {
    const price = this.currentStockPrice;
    if (price === null || !this.supportResistance) return null;

    const s2 = this.supportResistance.s2;
    const r2 = this.supportResistance.r2;

    const curr = this.currencyLabel;
    if (s2 != null && price < s2) {
      return `السعر الحالي (${price.toFixed(2)} ${curr}) أقل من أدنى نطاق مدعوم (S2: ${s2.toFixed(2)} ${curr})`;
    }
    if (r2 != null && price > r2) {
      return `السعر الحالي (${price.toFixed(2)} ${curr}) أعلى من أعلى نطاق مقاوم (R2: ${r2.toFixed(2)} ${curr})`;
    }
    return null;
  }

  get currencyLabel(): string {
    const c = (this.marketData?.currency || '').trim();
    if (c.includes('دولار') || c.includes('$') || c.toUpperCase().includes('USD')) return '$';
    return 'ج.م';
  }

  /**
   * Activity hard gate — نشاط الشركة is the first screening step. When it is
   * غير متوافق the stock is disqualified on its own, so neither the 7-source opinion
   * grid, nor the AAOIFI/S&P ratio panel, nor the Shariah-board panel are rendered;
   * only the single activity verdict is. The API follows the same gate (empty
   * shariahOpinions, null shariahPct, null shariahMetrics).
   */
  get isActivityNonCompliant(): boolean {
    const md = this.marketData;
    if (!md) return false;
    const flag = md.activityCompliant ?? md.shariahMetrics?.isCompliantActivity;
    return flag === false;
  }

  /** Business-activity classification behind the verdict, e.g. "خدمات مالية / تخصيص". */
  get activityClassificationLabel(): string {
    const md = this.marketData;
    const label = md?.activityClassification
      || md?.shariahMetrics?.activityClassification
      || md?.sectorNameAr;
    return label && label.trim() ? label : 'غير محدد';
  }

  /** True when the activity screen passes (inverse of the activity hard gate). */
  getActivityCompliant(): boolean {
    return !this.isActivityNonCompliant;
  }

  /**
   * Ratios-section visibility: depends on WHY the stock is non-compliant, not on
   * the status alone. Hidden only when the core business itself is impermissible
   * (activityCompliant === false), for board-governed stocks, or for the frozen
   * board ticker group. Permissible-activity stocks (any status: Compliant,
   * Doubtful, NonCompliant) and unclassified activity (null/undefined) always
   * show the section — with data or with "Data currently unavailable".
   */
  get shouldShowRatiosSection(): boolean {
    if (!this.marketData) return false;
    if (this.isActivityNonCompliant) return false;
    if (this.marketData.hasShariahBoard) return false;
    if (this.isShariahBoardFrozen) return false;
    return true;
  }

  /** True when the metrics DTO carries at least one usable ratio/flag value. */
  get hasShariahMetricsData(): boolean {
    const m = this.marketData?.shariahMetrics;
    if (!m) return false;
    return m.loansPercentage != null
      || m.interestBearingDebtRatio != null
      || m.haramEarningsPercentage != null
      || m.spHaramEarningPercentage != null
      || m.aaoifiHaramEarningPerShare != null
      || m.cashLiquidityCompliant != null
      || m.haramInvestmentsCompliant != null;
  }

  get nonSectoralIndices(): IndexInStockDto[] {
    return (this.marketData?.indices || []).filter(
      idx => idx.code !== 'Sectoral-Indices'
    );
  }

  getIndexLabel(code: string): string {
    if (code === 'Sectoral-Indices') {
      return this.marketData?.sectorNameAr || 'المؤشرات القطاعية';
    }
    return indexShortNameFor(code) || code;
  }

  /**
   * Returns the source text only if it contains meaningful (non-garbled) content.
   * Scraper sometimes saves question marks or Latin-only garbage from the source site.
   */
  getSourceText(text?: string | null): string {
    if (!text || !text.trim()) return 'بيانات محدثة آلياً';
    // Detect garbled content: if >50% of chars are '?' or replacement chars
    const garbled = (text.match(/[?\uFFFD]/g) || []).length;
    if (garbled > text.length * 0.3) return 'بيانات محدثة آلياً';
    return text.trim();
  }

  resolveSectorId(nameAr?: string | null, nameEn?: string | null): number | null {
    if (!nameAr && !nameEn) return null;
    const match = this.sectors.find(s =>
      (nameAr && s.nameAr && s.nameAr.trim().toLowerCase() === nameAr.trim().toLowerCase()) ||
      (nameEn && s.nameEn && s.nameEn.trim().toLowerCase() === nameEn.trim().toLowerCase())
    );
    return match ? match.id : null;
  }

  // ── Mappers for shared details components ───────────────────────────
  get headerTags(): MzHeaderTag[] {
    if (!this.marketData) return [];
    const tags: MzHeaderTag[] = [];
    if (this.marketData.sectorNameAr) {
      const hasWeight = this.marketData.sectorWeight !== null && this.marketData.sectorWeight !== undefined && this.marketData.sectorWeight > 0;
      const weightStr = hasWeight ? ` (${Number(this.marketData.sectorWeight).toFixed(2)}%)` : '';
      const sectorId = this.marketData.sectorId || this.resolveSectorId(this.marketData.sectorNameAr, this.marketData.sectorNameEn);
      tags.push({
        label: `${this.marketData.sectorNameAr}${weightStr}`,
        link: sectorId ? ['/indices/Sectoral-Indices', sectorId] : ['/indices/Sectoral-Indices'],
        tone: 'neutral'
      });
    }
    for (const idx of this.nonSectoralIndices) {
      const w = idx.weight && idx.weight > 0 ? ' (' + Number(idx.weight).toFixed(2) + '%)' : '';
      tags.push({
        label: this.getIndexLabel(idx.code) + w,
        link: ['/indices', idx.code],
        tone: 'default'
      });
    }
    return tags;
  }

  get srPoints(): MzSrPoint[] {
    if (!this.supportResistance) return [];
    const sr = this.supportResistance;
    const pts: MzSrPoint[] = [];
    if (sr.s2 != null) pts.push({ key: 's2', label: 'S2', value: Number(sr.s2).toFixed(2), pos: 5, kind: 's' });
    if (sr.s1 != null) pts.push({ key: 's1', label: 'S1', value: Number(sr.s1).toFixed(2), pos: 27.5, kind: 's' });
    if (sr.pivot != null) pts.push({ key: 'pivot', label: 'PIVOT', value: Number(sr.pivot).toFixed(2), pos: 50, kind: 'p' });
    if (sr.r1 != null) pts.push({ key: 'r1', label: 'R1', value: Number(sr.r1).toFixed(2), pos: 72.5, kind: 'r' });
    if (sr.r2 != null) pts.push({ key: 'r2', label: 'R2', value: Number(sr.r2).toFixed(2), pos: 95, kind: 'r' });
    return pts;
  }

  get fairValueGapText(): string | null {
    if (this.fairValuePremiumPct === null) return 'N/A';
    if (this.fairValueSignal === 'expensive') {
      const mult = this.showFairValueMultiple && this.fairValueMultiple !== null ? ' (فرصة للهبوط ' + Number(this.fairValueMultiple).toFixed(1) + 'x للوصول للسعر العادل)' : '';
      return '-' + Number(this.fairValuePremiumPct).toFixed(1) + '% — السعر أعلى من القيمة العادلة بنسبة ' + Number(this.fairValuePremiumPct).toFixed(1) + '%' + mult;
    }
    if (this.fairValueSignal === 'cheap') {
      const up = this.fairValueUpsidePct != null ? Number(this.fairValueUpsidePct).toFixed(1) : '';
      const mult = this.fairValueUpsideMultiple != null ? Number(this.fairValueUpsideMultiple).toFixed(1) : '';
      return 'السعر أقل من القيمة العادلة — فرصة صعود +' + up + '% (' + mult + 'x للوصول للعادلة)';
    }
    return Number(this.fairValuePremiumPct).toFixed(1) + '% — السعر قريب من القيمة العادلة';
  }

  get fairValueMethodsList(): MzFairMethod[] {
    const methods = this.marketData?.fairValueMethods || [];
    // Exclude Sector multiples as requested
    const filtered = methods.filter(m => {
      const n = (m.name || '').trim();
      return n !== 'SectorPE×EPS' && n !== 'SectorPB×BV';
    });

    const list: MzFairMethod[] = filtered.map(m => ({
      name: this.getMethodDisplayName(m.name),
      value: (m.value != null ? Number(m.value).toFixed(2) : '—') + ' ' + this.currencyLabel,
      outlier: !!m.isOutlier,
      outlierLabel: 'قيمة شاذة مستبعدة (Outlier)'
    }));

    // Ensure PEG ratio valuation is shown (empty '—' until calculated in future)
    const hasPeg = list.some(m => m.name.includes('PEG'));
    if (!hasPeg) {
      const pegEntry: MzFairMethod = {
        name: 'مكرر الربحية إلى النمو (PEG Ratio Valuation)',
        value: '—',
        outlier: false
      };
      const grahamIdx = list.findIndex(m => m.name.includes('جراهام'));
      if (grahamIdx >= 0) {
        list.splice(grahamIdx + 1, 0, pegEntry);
      } else {
        list.push(pegEntry);
      }
    }

    return list;
  }

  get shariaSummaryText(): string {
    if (this.isShariahBoardFrozen) return 'يوجد لجنة شرعية تشرف على هذا السهم وعلى توافق أنشطته ومعاييره الشرعية.';
    if (this.marketData?.hasShariahBoard) {
      return (this.marketData.shariahBoardNote || 'تشرف لجنة/هيئة شرعية على هذا السهم وعلى توافق أنشطته ومعاييره الشرعية.') +
        ' · الحكم المعتمد: ' + this.getVerdictLabel(this.marketData.shariahStatus);
    }
    const verdict = this.getVerdictLabel(this.internalVerdict);
    const purValue = this.spHaramPct != null ? Number(this.spHaramPct).toFixed(2) : (this.marketData?.shariahPct != null ? Number(this.marketData.shariahPct).toFixed(2) : null);
    const pur = this.showPurificationPct && purValue != null ? ' (نسبة التطهير: ' + purValue + '%)' : '';
    const ov = this.showScholarsHeaderNote ? ' — متوافق وفق فتاوى بعض العلماء الأفراد فقط (نسبة القروض ' + (this.loansPct != null ? Number(this.loansPct).toFixed(2) : '') + '% ≤ 50%)' :
      (this.showFallbackHeaderNote ? ' — متوافق وفق رأي الجهات الشرعية (النسب غير متوفرة)' : '');
    return 'الحكم الداخلي المعتمد: ' + verdict + pur + ov;
  }

  get shariaSummaryNote(): string | null {
    if (this.isShariahBoardFrozen || this.marketData?.hasShariahBoard) return null;
    if (this.totalAvailableSourcesCount === 0) return 'لا رأي مسجّل من أصل 7 مصادر مستقلة';
    const pct = this.compliancePercent !== null ? this.compliancePercent + '% مؤشرات متوافقة · ' : '';
    const noOp = this.noOpinionSourcesCount > 0 ? ' (' + this.noOpinionSourcesCount + ' بلا رأي)' : '';
    return this.compliantSourcesCount + ' من ' + this.totalAvailableSourcesCount + ' جهات تعتبر السهم متوافقاً · ' + pct + noOp;
  }

  get shariaSummaryTone(): 'good' | 'bad' | 'neutral' {
    if (this.isShariahBoardFrozen || this.isCompliant(this.internalVerdict)) return 'good';
    if (this.isNonCompliant(this.internalVerdict)) return 'bad';
    return 'neutral';
  }

  get shariaAuthoritiesList(): MzAuthority[] {
    if (this.isShariahBoardFrozen || this.marketData?.hasShariahBoard) return [];
    const list: MzAuthority[] = [];
    for (const op of this.sourceOpinionsList) {
      const isHalal = this.isHalalBourseCard(op);
      const isInsuff = isHalal && this.isHalalInsufficient;
      const status: 'good' | 'bad' | 'neutral' = op.noOpinion || isInsuff ? 'neutral' : (this.isCompliant(this.getCardStatus(op)) ? 'good' : 'bad');
      const statusLabel = op.noOpinion ? 'لا يوجد رأي مسجّل' : this.getVerdictLabel(this.getCardStatus(op));
      const date = op.sourceLastUpdated ? 'تحديث: ' + new Date(op.sourceLastUpdated).toISOString().slice(0, 10) :
        (op.fetchedAt ? 'جُلب: ' + new Date(op.fetchedAt).toISOString().slice(0, 10) : null);
      list.push({
        name: this.getSourceName(op.sourceKey),
        status,
        statusLabel,
        date: !op.noOpinion ? date : null,
        note: op.noOpinion ? 'لم تُصدر هذه الجهة رأياً على هذا السهم بعد — لا تُحتسب في نسبة الامتثال.' : (op.note || 'لا توجد ملاحظات تفصيلية مسجلة من المصدر.'),
        pdfUrl: this.isManualSource(op) ? this.pdfUrlFor(op) : null,
        actionLabel: isHalal && this.showDetailsButton ? 'عرض التفاصيل' : null
      });
    }

    // 8th card: EGX33
    list.push({
      name: 'مؤشر الشريعة EGX33',
      status: this.isEGX33Constituent ? 'good' : 'neutral',
      statusLabel: this.isEGX33Constituent ? 'ضمن مؤشر الشريعة EGX33' : 'غير مدرج في مؤشر الشريعة',
      note: this.isEGX33Constituent ? 'السهم مدرج ضمن مكونات مؤشر الشريعة EGX33.' : 'السهم غير مدرج في مكونات مؤشر الشريعة EGX33 (قد يكون متوافقاً شرعياً لأسباب أخرى).'
    });

    return list;
  }

  onAuthorityAction(a: MzAuthority): void {
    if (a.name.includes('حلال') || a.actionLabel === 'عرض التفاصيل') {
      this.openStandardsDialog();
    }
  }

  get shariaRatiosMetaText(): string | null {
    if (!this.shouldShowRatiosSection) return null;
    const date = this.marketData?.shariahMetrics?.sourceUpdatedAt;
    if (date) {
      try {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          const formatted = d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const time = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
          return `آخر تحديث للمصدر: ${formatted} ${time}`;
        }
      } catch { }
    }
    return this.marketData?.sourceLastUpdateText ? this.getSourceText(this.marketData.sourceLastUpdateText) : 'بيانات محدثة آلياً';
  }

  get detailedShariaRatiosList(): MzShariaRatio[] {
    if (!this.shouldShowRatiosSection || !this.hasShariahMetricsData) return [];

    // 1. Activity Classification
    const activityVal = this.activityClassificationLabel;
    const isActivityOk = this.getActivityCompliant();
    const activitySub = isActivityOk ? 'نشاط متوافق' : 'نشاط غير متوافق';
    const activityTone: 'positive' | 'negative' = isActivityOk ? 'positive' : 'negative';

    // 2. Purification Ratio (نسبة التطهير = نسبة الإيراد المحرم)
    let purVal = '—';
    let purSub = 'غير متوفر';
    let purTone: 'neutral' | 'positive' | 'negative' = 'neutral';
    if (this.spHaramPct != null) {
      const pct = Number(this.spHaramPct);
      purVal = `${pct.toFixed(2)}%`;
      if (pct <= 0) {
        purSub = 'لا يتطلب تطهير';
        purTone = 'positive';
      } else if (pct <= 1) {
        purSub = 'نسبة يسيرة جداً';
        purTone = 'positive';
      } else if (pct <= 5) {
        purSub = 'نسبة يسيرة';
        purTone = 'positive';
      } else if (pct <= 10) {
        purSub = 'نسبة متوسطة';
        purTone = 'neutral';
      } else if (pct <= 20) {
        purSub = 'نسبة مرتفعة نسبياً';
        purTone = 'neutral';
      } else {
        purSub = 'نسبة مرتفعة جداً (تجاوزت الحد)';
        purTone = 'negative';
      }
    }

    // 3. Impure Income Ratio (نسبة الإيراد المحرم)
    let spVal = '—';
    let spSub = 'أقل من الحد الأقصى (20%)';
    let spTone: 'positive' | 'negative' = 'positive';
    if (this.spHaramPct != null) {
      const pct = Number(this.spHaramPct);
      spVal = `${pct.toFixed(2)}%`;
      if (pct <= 20) {
        spSub = 'أقل من الحد الأقصى (20%)';
        spTone = 'positive';
      } else {
        spSub = 'أعلى من الحد الأقصى (20%)';
        spTone = 'negative';
      }
    }

    // 4. Debt & Interest
    let debtVal = '—';
    let debtSub = 'أقل من المعيار (30% / 33%)';
    let debtTone: 'positive' | 'negative' = 'positive';
    if (this.loansPct != null) {
      const debt = Number(this.loansPct);
      debtVal = `${debt.toFixed(2)}%`;
      if (debt <= 33.33) {
        debtSub = 'أقل من المعيار (30% / 33%)';
        debtTone = 'positive';
      } else {
        debtSub = 'أعلى من المعيار (30% / 33%)';
        debtTone = 'negative';
      }
    }

    return [
      {
        label: 'تصنيف النشاط',
        value: activityVal,
        subtext: activitySub,
        tone: activityTone
      },
      {
        label: 'نسبة التطهير',
        value: purVal,
        subtext: purSub,
        tone: purTone
      },
      {
        label: 'نسبة الإيراد المحرم',
        value: spVal,
        subtext: spSub,
        tone: spTone
      },
      {
        label: 'نسبة القروض والفوائد',
        value: debtVal,
        subtext: debtSub,
        tone: debtTone
      }
    ];
  }

  get shariaRatiosList(): MzMetric[] {
    if (!this.shouldShowRatiosSection || !this.hasShariahMetricsData) return [];
    return [
      {
        label: 'تصنيف النشاط',
        value: this.marketData?.shariahMetrics?.activityClassification || this.marketData?.sectorNameAr || 'نشاط تشغيلي تجاري',
        tone: null
      },
      {
        label: 'نسبة التطهير',
        value: (this.spHaramPct != null ? Number(this.spHaramPct).toFixed(2) : '—') + '%',
        tone: null,
        ltr: true
      },
      {
        label: 'نسبة الإيراد المحرم',
        value: (this.spHaramPct != null ? Number(this.spHaramPct).toFixed(2) : '—') + '%',
        tone: this.spHaramPct != null && this.spHaramPct > 20 ? 'negative' : 'positive',
        ltr: true
      },
      {
        label: 'نسبة القروض والفوائد',
        value: (this.loansPct != null ? Number(this.loansPct).toFixed(2) : '—') + '%',
        tone: this.loansPct != null && this.loansPct > 33.33 ? 'negative' : 'positive',
        ltr: true
      }
    ];
  }

  get effectiveSharesOutstanding(): number | null {
    const md = this.marketData;
    if (!md) return null;
    if (md.sharesOutstanding != null && Number(md.sharesOutstanding) > 0) {
      return Number(md.sharesOutstanding);
    }
    // Compute from Market Value / Closing Price if both exist
    if (md.marketValue != null && md.closingPrice != null && Number(md.closingPrice) > 0) {
      return Number(md.marketValue) / Number(md.closingPrice);
    }
    return null;
  }

  get marketIndicatorsList(): MzIndicator[] {
    const md = this.marketData;
    if (!md) return [];
    const cur = this.currencyLabel;
    const shares = this.effectiveSharesOutstanding;

    return [
      { label: 'القيمة الاسمية', value: md.nominalValue != null ? Number(md.nominalValue).toFixed(2) + ' ' + cur : '—', ltr: true },
      { label: 'القيمة الدفترية', value: md.bookValue != null ? Number(md.bookValue).toFixed(2) + ' ' + cur : '—', ltr: true },
      { label: 'مضاعف القيمة الدفترية (P/B)', value: md.pbRatio ? Number(md.pbRatio).toFixed(2) + 'x' : '—', ltr: true },
      { label: 'ربحية السهم (EPS)', value: md.eps != null ? Number(md.eps).toFixed(2) + ' ' + cur : '—', ltr: true },
      { label: 'مضاعف الربحية (P/E)', value: md.peRatio ? Number(md.peRatio).toFixed(2) + 'x' : '—', ltr: true },
      { label: 'القيمة السوقية', value: md.marketValue != null ? Number(md.marketValue).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ' + cur : '—', ltr: true },
      { label: 'أعلى سعر بالجلسة', value: md.high != null ? Number(md.high).toFixed(2) : '—', ltr: true },
      { label: 'أدنى سعر بالجلسة', value: md.low != null ? Number(md.low).toFixed(2) : '—', ltr: true },
      { label: 'معدل نمو الأرباح', value: md.earningsGrowthRate != null ? `${md.earningsGrowthRate > 0 ? '+' : ''}${Number(md.earningsGrowthRate).toFixed(1)}%` : '—', ltr: true },
      { label: 'معدل نمو ربحية السهم', value: md.epsGrowthRate != null ? `${md.epsGrowthRate > 0 ? '+' : ''}${Number(md.epsGrowthRate).toFixed(1)}%` : '—', ltr: true },
      { label: 'التدفق النقدي الحر (Free Cash Flow)', value: md.freeCashFlow != null ? `${Number(md.freeCashFlow).toLocaleString('en-US', { maximumFractionDigits: 1 })} مليون ${cur}` : '—', ltr: true },
      { label: 'عدد الأسهم القائمة', value: shares != null ? `${(shares / 1000000).toLocaleString('en-US', { maximumFractionDigits: 2 })} مليون سهم` : '—', ltr: true }
    ];
  }

}
