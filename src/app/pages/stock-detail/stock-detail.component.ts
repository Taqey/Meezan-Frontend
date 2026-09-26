import { Component, OnInit } from '@angular/core';
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
  FileText
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { ComparisonBadgeComponent } from '../../components/comparison-badge/comparison-badge.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import {
  MarketDataDto,
  SHARIAH_SOURCE_NAMES,
  ShariahSourceKey,
  ShariahSourceOpinionDto,
  SupportResistanceDto,
  INDEX_ARABIC_NAMES
} from '../../models/api.models';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ComparisonBadgeComponent, StatusBadgeComponent],
  template: `
    <div *ngIf="loading" class="empty-state">
      <p>جارٍ تحميل بيانات السهم والتقييمات من قاعدة البيانات...</p>
    </div>

    <div *ngIf="!loading && !marketData" class="empty-state">
      <h3>لم يتم العثور على بيانات لهذا السهم</h3>
      <a routerLink="/stocks" class="text-link">العودة إلى قائمة الأسهم</a>
    </div>

    <div *ngIf="!loading && marketData">
      <!-- Detail Hero -->
      <div class="detail-hero">
        <a routerLink="/stocks" class="back-link">
          <lucide-icon [img]="ArrowLeftIcon" size="15"></lucide-icon> العودة إلى الأسهم
        </a>

        <div class="detail-heading">
          <div>
            <div class="ticker large">
              {{ marketData.ticker }}
              <span *ngIf="marketData.nameEn">{{ marketData.nameEn }}</span>
            </div>
            <h1>{{ marketData.nameAr || marketData.ticker }}</h1>
            <div class="tag-row">
              <span *ngIf="marketData.sectorNameAr">{{ marketData.sectorNameAr }}</span>
              <ng-container *ngFor="let idx of marketData.indices">
                <a [routerLink]="['/indices', idx.code]">
                  {{ getIndexLabel(idx.code) }}<ng-container *ngIf="idx.weight && idx.weight > 0"> ({{ idx.weight | number:'1.2-2' }}%)</ng-container>
                </a>
              </ng-container>
            </div>
          </div>

          <div class="detail-price" *ngIf="marketData.hasMarketData !== false">
            <span>سعر الإغلاق الأخير</span>
            <strong *ngIf="marketData.closingPrice !== null && marketData.closingPrice !== undefined; else noPrice">
              {{ marketData.closingPrice | number:'1.2-2' }} <small>{{ currencyLabel }}</small>
            </strong>
            <ng-template #noPrice>
              <strong>— <small>{{ currencyLabel }}</small></strong>
            </ng-template>
            <b *ngIf="supportResistance?.changePct !== null && supportResistance?.changePct !== undefined"
               [ngClass]="(supportResistance?.changePct ?? 0) >= 0 ? 'positive' : 'negative'">
              {{ (supportResistance?.changePct ?? 0) > 0 ? '+' : '' }}{{ supportResistance?.changePct | number:'1.2-2' }}%
            </b>
          </div>
          <div class="detail-price board-only-notice" *ngIf="marketData.hasMarketData === false">
            <span class="muted">بيانات التداول والسوق</span>
            <strong>غير متداولة / غير مقيدة في مباشر</strong>
          </div>
        </div>
      </div>

      <!-- Detail Grid: Support/Resistance + Fair Value (Only if stock has market data) -->
      <div class="detail-grid" *ngIf="marketData.hasMarketData !== false">
        <!-- Support & Resistance Ladder -->
        <div class="detail-card support-card">
          <div class="card-heading">
            <div>
              <span class="eyebrow">قراءة فنية</span>
              <h2>الدعم والمقاومة والارتكاز</h2>
            </div>
            <span class="neutral-pill" *ngIf="supportResistance">
              الارتكاز: {{ supportResistance.pivot != null ? (supportResistance.pivot | number:'1.2-2') : '—' }} {{ currencyLabel }}
            </span>
          </div>

          <!-- Out of range notice if price is outside [S2, R2] -->
          <div class="ladder-out-of-range-note" *ngIf="supportResistance && supportResistanceOutOfRangeNote">
            <lucide-icon [img]="InfoIcon" size="16"></lucide-icon>
            <span>{{ supportResistanceOutOfRangeNote }}</span>
          </div>

          <div class="ladder" *ngIf="supportResistance">
            <div class="ladder-line"></div>
            <!-- Dynamic current-price marker (hidden if price is outside [S2, R2]) -->
            <div class="current-marker" *ngIf="supportResistanceMarkerPosition !== null" [style.right.%]="supportResistanceMarkerPosition">
              <span>السعر {{ currentStockPrice | number:'1.2-2' }}</span>
            </div>
            <div class="ladder-point" style="right: 5%;">
              <i></i>
              <b>S2</b>
              <span>{{ supportResistance.s2 != null ? (supportResistance.s2 | number:'1.2-2') : '—' }}</span>
            </div>
            <div class="ladder-point" style="right: 27.5%;">
              <i></i>
              <b>S1</b>
              <span>{{ supportResistance.s1 != null ? (supportResistance.s1 | number:'1.2-2') : '—' }}</span>
            </div>
            <div class="ladder-point" style="right: 50%;">
              <i></i>
              <b>PIVOT</b>
              <span>{{ supportResistance.pivot != null ? (supportResistance.pivot | number:'1.2-2') : '—' }}</span>
            </div>
            <div class="ladder-point" style="right: 72.5%;">
              <i></i>
              <b>R1</b>
              <span>{{ supportResistance.r1 != null ? (supportResistance.r1 | number:'1.2-2') : '—' }}</span>
            </div>
            <div class="ladder-point" style="right: 95%;">
              <i></i>
              <b>R2</b>
              <span>{{ supportResistance.r2 != null ? (supportResistance.r2 | number:'1.2-2') : '—' }}</span>
            </div>
          </div>
          <div *ngIf="!supportResistance" class="muted" style="margin-top: 40px;">
            بيانات الدعم والمقاومة غير متوفرة حالياً لهذا السهم.
          </div>
        </div>

        <!-- Fair Value Card (4 methods with IQR outlier rejection) -->
        <div class="detail-card fair-card">
          <div class="card-heading">
            <div>
              <span class="eyebrow">تقييم عادل (IQR Fences)</span>
              <h2>القيمة العادلة المجمعة</h2>
            </div>
            <app-comparison-badge [comparison]="marketData.priceComparison"></app-comparison-badge>
          </div>

          <!-- Insufficient data: no trustworthy fair value exists. Shown instead of a
               fabricated "قريبة من العادلة — 0.00" verdict: no numeric fair value, no
               confidence %, no approved-methods line. -->
          <div class="fair-unavailable" *ngIf="isFairValueUnavailable">
            <strong>بيانات غير كافية لحساب القيمة العادلة</strong>
            <p class="muted">
              لا توجد حالياً طرق تقييم مُعتمدة لهذا السهم (ربحية EPS، قيمة دفترية، أو بيانات قطاع
              كافية) أو أن سعر السهم الحالي غير متاح. لن تُعرض قيمة عادلة رقمية أو نسبة ثقة حتى
              توفّر هذه البيانات.
            </p>
          </div>

          <ng-container *ngIf="!isFairValueUnavailable">
            <div class="fair-number">
              <strong>{{ marketData.fairValue | number:'1.2-2' }}</strong>
              <span>{{ currencyLabel }}</span>
              <b *ngIf="marketData.fairValueDiffPct !== null && marketData.fairValueDiffPct !== undefined"
                 [ngClass]="marketData.fairValueDiffPct >= 0 ? 'positive' : 'negative'">
                {{ marketData.fairValueDiffPct > 0 ? '+' : '' }}{{ marketData.fairValueDiffPct | number:'1.2-2' }}% عن السعر الحالي
              </b>
            </div>

            <p class="muted">
              مستوى الثقة: <strong>{{ getConfidenceLabel(marketData.valuationConfidence) }}</strong> ·
              اعتُمدت {{ marketData.methodsUsedCount ?? 0 }} طرق واستُبعدت {{ marketData.methodsExcludedCount ?? 0 }} كقيم شاذة عبر نطاق Tukey IQR (1.5×IQR).
            </p>

            <!-- 4 Methods List -->
            <div class="method-list" *ngIf="marketData.fairValueMethods && marketData.fairValueMethods.length">
              <div class="method" *ngFor="let m of marketData.fairValueMethods" [class.outlier]="m.isOutlier">
                <span>{{ getMethodDisplayName(m.name) }}</span>
                <strong>{{ m.value != null ? (m.value | number:'1.2-2') : '—' }} {{ currencyLabel }}</strong>
                <em *ngIf="m.isOutlier">قيمة شاذة مستبعدة (Outlier)</em>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- Shariah Opinions Grid: Multi-source evaluators -->
      <section class="detail-card shariah-card">
        <!-- Simplified display for stocks overseen by their own Sharia board/committee
             (plain "لجنة شرعية" and accredited "هيئة رقابة شرعية داخلية معتمدة" are the
             same case): status + one note only — no purification %, no 7-source grid,
             no AAOIFI/S&P metrics panel. -->
        <div class="card-heading" *ngIf="marketData.hasShariahBoard">
          <div>
            <span class="eyebrow">الإشراف الشرعي</span>
            <h2>الإشراف الشرعي للسهم</h2>
            <p>الحكم المعتمد: <app-status-badge [status]="marketData.shariahStatus"></app-status-badge></p>
          </div>
          <div class="ratio-big">
            <strong>موجودة</strong>
            <span>لجنة أو هيئة شرعية تشرف على السهم</span>
          </div>
        </div>

        <div class="board-exists-panel" *ngIf="marketData.hasShariahBoard">
          <p class="board-note">{{ marketData.shariahBoardNote || 'تشرف لجنة/هيئة شرعية على هذا السهم وعلى توافق أنشطته ومعاييره الشرعية.' }}</p>
        </div>

        <div class="card-heading" *ngIf="!marketData.hasShariahBoard">
          <div>
            <span class="eyebrow">تغطية الجهات الشرعية</span>
            <h2>آراء الهيئات الشرعية (7 مصادر مستقلة)</h2>
            <p>الحكم الداخلي المعتمد: <app-status-badge [status]="marketData.shariahStatus"></app-status-badge> <span *ngIf="marketData.shariahPct"> (نسبة التطهير: {{ marketData.shariahPct }}%)</span></p>
          </div>
          <div class="ratio-big">
            <strong>{{ compliantSourcesCount }} من {{ totalAvailableSourcesCount }}</strong>
            <span>جهات تعتبر السهم متوافقاً</span>
          </div>
        </div>

        <div class="opinion-grid" *ngIf="!marketData.hasShariahBoard">
          <div class="source-card" *ngFor="let op of sourceOpinionsList">
            <div class="source-top">
              <strong>{{ getSourceName(op.sourceKey) }}</strong>
              <app-status-badge [status]="op.status"></app-status-badge>
            </div>

            <div class="source-progress">
              <span [style.width.%]="op.percentage || (op.status === 'Compliant' ? 100 : 0)"></span>
            </div>

            <div class="source-details">
              <span>{{ op.percentage ? op.percentage + '% مؤشرات متوافقة' : (op.status ? op.status : 'لا توجد نسبة معلنة') }}</span>
              <span *ngIf="op.sourceLastUpdated">تحديث: {{ op.sourceLastUpdated | date:'yyyy-MM-dd' }}</span>
              <span *ngIf="!op.sourceLastUpdated && op.fetchedAt">جُلب: {{ op.fetchedAt | date:'yyyy-MM-dd' }}</span>
            </div>

            <p>{{ op.note || 'لا توجد ملاحظات تفصيلية مسجلة من المصدر.' }}</p>

            <a *ngIf="op.pdfUrl" [href]="op.pdfUrl" target="_blank" rel="noopener noreferrer" class="pdf-link">
              <lucide-icon [img]="FileTextIcon" size="14"></lucide-icon> عرض قائمة المصدر / PDF
            </a>
          </div>
        </div>

        <!-- Dedicated Shariah Metrics Section (AAOIFI & S&P Breakdown) - Suppressed for
             NonCompliant stocks, board-governed stocks, or when no metrics exist -->
        <div class="shariah-metrics-panel" *ngIf="marketData.shariahMetrics && marketData.shariahStatus !== 'NonCompliant' && !marketData.hasShariahBoard">
          <div class="metrics-header">
            <div>
              <h3>المعايير والنسب المالية الشرعية التفصيلية (AAOIFI & S&P)</h3>
              <span class="muted" *ngIf="marketData.shariahMetrics?.sourceUpdatedAt">
                آخر تحديث للمصدر: {{ marketData.shariahMetrics?.sourceUpdatedAt | date:'yyyy-MM-dd HH:mm' }}
              </span>
            </div>
            <div class="metrics-flags">
              <span class="flag-badge" [class.pass]="getActivityCompliant()" [class.fail]="!getActivityCompliant()">
                نشاط الشركة: {{ getActivityCompliant() ? 'متوافق' : 'غير متوافق' }}
              </span>
              <span class="flag-badge" [class.pass]="getAaoifiCompliant()" [class.fail]="!getAaoifiCompliant()">
                معيار AAOIFI: {{ getAaoifiCompliant() ? 'مجاز' : 'غير مجاز' }}
              </span>
              <span class="flag-badge" [class.pass]="getSpCompliant()" [class.fail]="!getSpCompliant()">
                معيار S&P: {{ getSpCompliant() ? 'مجاز' : 'غير مجاز' }}
              </span>
            </div>
          </div>

          <div class="metrics-grid">
            <div class="metric-cell">
              <span>تصنيف النشاط</span>
              <strong>{{ marketData.shariahMetrics?.activityClassification || marketData.sectorNameAr || 'نشاط تشغيلي تجاري' }}</strong>
            </div>
            <div class="metric-cell">
              <span>تطهير السهم (AAOIFI)</span>
              <strong>{{ aaoifiHaramPerShare != null ? aaoifiHaramPerShare : '—' }} {{ currencyLabel }}/سهم</strong>
            </div>
            <div class="metric-cell">
              <span>نسبة الإيراد المحرم (S&P)</span>
              <strong>{{ spHaramPct != null ? spHaramPct : '—' }}%</strong>
            </div>
            <div class="metric-cell">
              <span>نسبة القروض والفوائد</span>
              <strong>{{ loansPct != null ? loansPct : '—' }}%</strong>
            </div>
          </div>
        </div>
      </section>

      <!-- Market Data Fundamentals (Only if stock has market data) -->
      <section class="detail-card market-card" *ngIf="marketData.hasMarketData !== false">
        <div class="card-heading">
          <div>
            <span class="eyebrow">بيانات التداول والقوائم</span>
            <h2>مؤشرات السوق المالية</h2>
          </div>
          <span class="muted">{{ getSourceText(marketData.sourceLastUpdateText) }}</span>
        </div>

        <div class="fundamentals">
          <div>
            <span>القيمة الاسمية</span>
            <strong>{{ marketData.nominalValue != null ? (marketData.nominalValue | number:'1.2-2') + ' ' + (marketData.currency || 'ج.م') : '—' }}</strong>
          </div>
          <div>
            <span>القيمة الدفترية</span>
            <strong>{{ marketData.bookValue != null ? (marketData.bookValue | number:'1.2-2') + ' ' + (marketData.currency || 'ج.م') : '—' }}</strong>
          </div>
          <div>
            <span>مضاعف القيمة الدفترية (P/B)</span>
            <strong>{{ marketData.pbRatio ? (marketData.pbRatio | number:'1.2-2') + 'x' : '—' }}</strong>
          </div>
          <div>
            <span>ربحية السهم (EPS)</span>
            <strong>{{ marketData.eps != null ? (marketData.eps | number:'1.2-2') + ' ' + (marketData.currency || 'ج.م') : '—' }}</strong>
          </div>
          <div>
            <span>مضاعف الربحية (P/E)</span>
            <strong>{{ marketData.peRatio ? (marketData.peRatio | number:'1.2-2') + 'x' : '—' }}</strong>
          </div>
          <div>
            <span>القيمة السوقية</span>
            <strong>{{ marketData.marketValue != null ? (marketData.marketValue | number:'1.0-0') : '—' }}</strong>
          </div>
          <div>
            <span>أعلى سعر بالجلسة</span>
            <strong>{{ marketData.high != null ? (marketData.high | number:'1.2-2') : '—' }}</strong>
          </div>
          <div>
            <span>أدنى سعر بالجلسة</span>
            <strong>{{ marketData.low != null ? (marketData.low | number:'1.2-2') : '—' }}</strong>
          </div>
        </div>
      </section>
    </div>
  `
})
export class StockDetailComponent implements OnInit {
  readonly ArrowLeftIcon = ArrowLeft;
  readonly BookOpenIcon = BookOpen;
  readonly FileTextIcon = FileText;
  readonly InfoIcon = Info;

  ticker = '';
  marketData?: MarketDataDto | null;
  supportResistance?: SupportResistanceDto | null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.ticker = params.get('code') || '';
      if (this.ticker) {
        this.loadStockData();
      }
    });
  }

  loadStockData(): void {
    this.loading = true;
    this.api.getMarketData(this.ticker).subscribe({
      next: (data) => {
        this.marketData = data;
        this.loading = false;
      },
      error: () => {
        this.marketData = null;
        this.loading = false;
      }
    });

    this.api.getSupportResistance(this.ticker).subscribe({
      next: (sr) => {
        this.supportResistance = sr;
      },
      error: () => {
        this.supportResistance = null;
      }
    });
  }

  get sourceOpinionsList(): ShariahSourceOpinionDto[] {
    const existing = this.marketData?.shariahOpinions || [];
    const map = new Map<number, ShariahSourceOpinionDto>();
    for (const op of existing) {
      map.set(Number(op.sourceKey), op);
    }

    // Ensure all 7 sources have an entry represented in the UI
    const allSources = [
      ShariahSourceKey.HalalBourse,
      ShariahSourceKey.Musaffa,
      ShariahSourceKey.Kashif,
      ShariahSourceKey.HalalInvest,
      ShariahSourceKey.FaisalBank,
      ShariahSourceKey.Osoul,
      ShariahSourceKey.Thndr
    ];

    return allSources.map((key) => {
      if (map.has(key)) {
        return map.get(key)!;
      }
      return {
        sourceKey: key,
        status: 'غير متوفر',
        note: 'لم يصدر تصنيف معلن لهذا السهم حتى الآن'
      };
    });
  }

  get compliantSourcesCount(): number {
    return (this.marketData?.shariahOpinions || []).filter(
      (o) => (o.status || '').toLowerCase() === 'compliant'
    ).length;
  }

  get totalAvailableSourcesCount(): number {
    return 7;
  }

  getSourceName(key: number): string {
    return SHARIAH_SOURCE_NAMES[key]?.ar || `جهة شرعية #${key}`;
  }

  getMethodDisplayName(name: string): string {
    const n = name.trim();
    if (n === 'Graham') return 'نموذج جراهام (Graham Formula)';
    if (n === 'SectorPE×EPS') return 'مضاعف ربحية القطاع (Sector P/E × EPS)';
    if (n === 'SectorPB×BV') return 'مضاعف دفتري القطاع (Sector P/B × Book Value)';
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
    const c = this.marketData?.currency || '';
    if (c.includes('دولار') || c.includes('$') || c.toUpperCase().includes('USD')) return '$';
    return 'ج.م';
  }

  /** Returns true if activity is compliant. Defaults to false for NonCompliant stocks when null. */
  getActivityCompliant(): boolean {
    const v = this.marketData?.shariahMetrics?.isCompliantActivity;
    if (v !== null && v !== undefined) return v;
    return this.marketData?.shariahStatus !== 'NonCompliant';
  }

  /** Returns true if AAOIFI compliant. Defaults to false for NonCompliant stocks when null. */
  getAaoifiCompliant(): boolean {
    const v = this.marketData?.shariahMetrics?.isCompliantAaoifi;
    if (v !== null && v !== undefined) return v;
    return this.marketData?.shariahStatus !== 'NonCompliant';
  }

  /** Returns true if S&P compliant. Defaults to false for NonCompliant stocks when null. */
  getSpCompliant(): boolean {
    const v = this.marketData?.shariahMetrics?.isCompliantSp;
    if (v !== null && v !== undefined) return v;
    return this.marketData?.shariahStatus !== 'NonCompliant';
  }

  getIndexLabel(code: string): string {
    if (code === 'Sectoral-Indices') {
      return this.marketData?.sectorNameAr || INDEX_ARABIC_NAMES['Sectoral-Indices'] || 'قطاعي';
    }
    return INDEX_ARABIC_NAMES[code] || code;
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
}
