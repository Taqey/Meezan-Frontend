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
import { ComparisonBadgeComponent } from '../../components/comparison-badge/comparison-badge.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { FavoriteToggleComponent } from '../../components/favorite-toggle/favorite-toggle.component';
import { RevealDirective } from '../../directives/reveal.directive';
import {
  IndexInStockDto,
  MarketDataDto,
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

/** One board's card: either its real stored opinion, or an explicit "no opinion" state. */
type ShariahSourceOpinionView = ShariahSourceOpinionDto & { noOpinion: boolean };

/** Card view: Halal Bourse carries the STORED verdict; other boards carry raw (doubtful sanitized to no-opinion). */
type EffectiveOpinionView = ShariahSourceOpinionView & { effectiveStatus: string | null; rawDisplayStatus: string | null; upgraded: boolean };

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ComparisonBadgeComponent, StatusBadgeComponent, FavoriteToggleComponent, RevealDirective],
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
              <app-favorite-toggle [symbol]="marketData.ticker"></app-favorite-toggle>
              <span *ngIf="marketData.nameEn">{{ marketData.nameEn }}</span>
            </div>
            <h1>{{ marketData.nameAr || marketData.ticker }}</h1>
            <div class="tag-row">
              <span *ngIf="marketData.sectorNameAr">{{ marketData.sectorNameAr }}</span>
              <span *ngIf="marketData.sectorWeight !== null && marketData.sectorWeight !== undefined && marketData.sectorWeight > 0"
                    class="sector-weight-tag"
                    [class.capped]="marketData.isSectorWeightCapped"
                    [title]="marketData.isSectorWeightCapped ? 'الوزن النسبي مسقوف عند 35% (معامل السقف: ' + (marketData.sectorCappingFactor | number:'1.4-4') + ')' : 'الوزن النسبي في قطاع ' + (marketData.sectorNameAr || '')">
                الوزن في القطاع: {{ marketData.sectorWeight | number:'1.2-2' }}%
                <small *ngIf="marketData.isSectorWeightCapped">(مسقوف - معامل: {{ marketData.sectorCappingFactor | number:'1.4-4' }})</small>
              </span>
              <span *ngIf="marketData.sectorWeight === null && marketData.sectorNameAr"
                    class="sector-weight-tag muted"
                    title="لا توجد قيمة سوقية صالحة لحساب الوزن">
                الوزن في القطاع: —
              </span>
              <ng-container *ngFor="let idx of nonSectoralIndices">
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

        <!-- Fair Value Card (Graham formula only) -->
        <div class="detail-card fair-card">
          <div class="card-heading">
            <div>
              <span class="eyebrow">نموذج جراهام (Graham Formula)</span>
              <h2>القيمة العادلة</h2>
            </div>
            <app-comparison-badge [comparison]="fairValueComparison"></app-comparison-badge>
          </div>

          <!-- Insufficient data: no trustworthy fair value exists (Graham needs EPS > 0 & BookValue > 0).
               Shown instead of a fabricated "قريبة من العادلة — 0.00" verdict: no numeric fair value, no
               confidence %, no approved-methods line. -->
          <div class="fair-unavailable" *ngIf="isFairValueUnavailable">
            <strong>بيانات غير كافية لحساب القيمة العادلة (نموذج جراهام)</strong>
            <p class="muted">
              لا توجد حالياً بيانات كافية لنموذج جراهام (ربحية EPS، قيمة دفترية BookValue، أو سعر السهم الحالي
              غير متاح). لن تُعرض قيمة عادلة رقمية أو نسبة ثقة حتى توفّر هذه البيانات.
            </p>
          </div>

          <ng-container *ngIf="!isFairValueUnavailable">
            <div class="fair-number">
              <strong>{{ marketData.fairValue | number:'1.2-2' }}</strong>
              <span>{{ currencyLabel }}</span>
              <b *ngIf="fairValuePremiumPct !== null; else fvGapNa"
                 [ngClass]="fairValueSignal === 'cheap' ? 'positive' : (fairValueSignal === 'expensive' ? 'negative' : '')">
                <ng-container *ngIf="fairValueSignal === 'expensive'">-{{ fairValuePremiumPct | number:'1.1-1' }}% — السعر أعلى من القيمة العادلة بنسبة {{ fairValuePremiumPct | number:'1.1-1' }}%-<span *ngIf="showFairValueMultiple"> (فرصة للهبوط {{ fairValueMultiple | number:'1.1-1' }}x للوصول للسعر العادل)</span></ng-container>
                <ng-container *ngIf="fairValueSignal === 'cheap'">السعر أقل من القيمة العادلة — فرصة صعود +{{ fairValueUpsidePct | number:'1.1-1' }}% ({{ fairValueUpsideMultiple | number:'1.1-1' }}x للوصول للعادلة)</ng-container>
                <ng-container *ngIf="fairValueSignal !== 'cheap' && fairValueSignal !== 'expensive'">{{ fairValuePremiumPct | number:'1.1-1' }}% — السعر قريب من القيمة العادلة</ng-container>
              </b>
              <ng-template #fvGapNa><b class="muted">N/A</b></ng-template>
            </div>

            <p class="muted">
              نموذج جراهام: √(22.5 × EPS × BookValue) · مستوى الثقة: <strong>{{ getConfidenceLabel(marketData.valuationConfidence) }}</strong>
            </p>

            <!-- 4 Methods List (displayed individually, no aggregation) -->
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

      <!-- Shariah Opinions Grid: Multi-source evaluators.
           Hidden entirely when نشاط الشركة is غير متوافق: the activity is a standalone,
           automatic disqualification, so no board opinion grid and no ratio panel apply. -->
      <section class="detail-card shariah-card" *ngIf="!isActivityNonCompliant" appReveal>
        <!-- Permanent display-layer override for frozen ticker group:
             ADIB, SAUD, FAIT, FAITA, ATLC, AMIA.
             Shows only a single green "يوجد لجنة شرعية" badge.
             Skips normal rendering (7-source opinions and AAOIFI & S&P ratio panel) entirely. -->
        <ng-container *ngIf="isShariahBoardFrozen">
          <div class="card-heading">
            <div>
              <span class="eyebrow">الإشراف الشرعي</span>
              <h2>الإشراف الشرعي للسهم</h2>
            </div>
            <div>
              <span class="status-badge status-good" style="font-size: 13px; padding: 6px 14px;">
                <span class="status-dot"></span>
                يوجد لجنة شرعية
              </span>
            </div>
          </div>

          <div class="board-exists-panel">
            <p class="board-note" style="margin: 0;">تشرف لجنة/هيئة شرعية على هذا السهم وعلى توافق أنشطته ومعاييره الشرعية.</p>
          </div>
        </ng-container>

        <!-- Standard resolution pipeline for all other tickers outside the frozen list -->
        <ng-container *ngIf="!isShariahBoardFrozen">
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
              <p>الحكم الداخلي المعتمد: <app-status-badge [status]="internalVerdict"></app-status-badge><span *ngIf="showPurificationPct"> (نسبة التطهير: {{ marketData.shariahPct }}%)</span><span *ngIf="showScholarsHeaderNote" class="verdict-override-note"> — متوافق وفق فتاوى بعض العلماء الأفراد فقط (نسبة القروض {{ loansPct | number:'1.0-2' }}% ≤ 50%)</span><span *ngIf="showFallbackHeaderNote" class="verdict-override-note"> — متوافق وفق رأي الجهات الشرعية (النسب غير متوفرة)</span></p>
            </div>
            <div class="ratio-big">
              <!-- Aggregate is over boards that actually returned a stored opinion for THIS
                   stock (per stock-board pair), never a fixed /7 when coverage is incomplete. -->
              <strong *ngIf="totalAvailableSourcesCount > 0">
                {{ compliantSourcesCount }} من {{ totalAvailableSourcesCount }}
              </strong>
              <strong *ngIf="totalAvailableSourcesCount === 0" class="no-coverage">لا رأي مسجّل</strong>
              <span *ngIf="totalAvailableSourcesCount > 0">جهات تعتبر السهم متوافقاً</span>
              <span *ngIf="totalAvailableSourcesCount === 0">من أصل 7 مصادر مستقلة</span>
              <span class="coverage-note" *ngIf="compliancePercent !== null">
                {{ compliancePercent }}% مؤشرات متوافقة من أصل {{ totalAvailableSourcesCount }} رأياً مسجّلاً
              </span>
              <span class="coverage-note muted" *ngIf="noOpinionSourcesCount > 0">
                {{ noOpinionSourcesCount }} من 7 بلا رأي مسجّل على هذا السهم
              </span>
            </div>
          </div>

<div class="opinion-grid" *ngIf="!marketData.hasShariahBoard">
           <!-- 7 board cards. Halal Bourse shows the STORED verdict only;
                other boards show their raw opinion (doubtful sanitized to no-opinion). -->
           <div class="source-card"
                [class.no-opinion]="op.noOpinion || (isHalalBourseCard(op) && isHalalInsufficient)"
                [class.compliant]="!op.noOpinion && !(isHalalBourseCard(op) && isHalalInsufficient) && isCompliant(getCardStatus(op))"
                [class.non-compliant]="!op.noOpinion && !(isHalalBourseCard(op) && isHalalInsufficient) && isNonCompliant(getCardStatus(op))"
                *ngFor="let op of sourceOpinionsList; let i = index; trackBy: trackOpinionByKey"
                [style.--item-index]="i">
            <div class="source-top">
              <strong>{{ getSourceName(op.sourceKey) }}</strong>
              <!-- No recorded opinion on this stock: say so explicitly instead of
                   rendering a default متوافق / غير متوافق verdict. -->
              <span class="no-opinion-label" *ngIf="op.noOpinion">لا يوجد رأي مسجّل</span>
              <app-status-badge *ngIf="!op.noOpinion && !isManualSource(op)" [status]="getCardStatus(op)"></app-status-badge>
            </div>

            <p class="no-opinion-hint" *ngIf="op.noOpinion">
              لم تُصدر هذه الجهة رأياً على هذا السهم بعد — لا تُحتسب في نسبة الامتثال.
            </p>

            <!-- All 7 boards: unified full-color card, no progress/score -->
            <ng-container *ngIf="!op.noOpinion">
              <div class="verdict-badge">
                {{ getVerdictLabel(getCardStatus(op)) }}
              </div>
              <div class="verdict-meta">
                <span *ngIf="op.sourceLastUpdated">تحديث: {{ op.sourceLastUpdated | date:'yyyy-MM-dd' }}</span>
                <span *ngIf="!op.sourceLastUpdated && op.fetchedAt">جُلب: {{ op.fetchedAt | date:'yyyy-MM-dd' }}</span>
              </div>
              <p class="verdict-note">{{ op.note || 'لا توجد ملاحظات تفصيلية مسجلة من المصدر.' }}</p>
              <!-- PDF link for manual sources (FaisalBank, Ostoul) when stored.
                   Absolute backend URL via the shared helper: the stored path is
                   backend-relative and would resolve to the SPA (home page) here. -->
              <a *ngIf="isManualSource(op) && pdfUrlFor(op)" [href]="pdfUrlFor(op)" target="_blank" rel="noopener noreferrer" class="verdict-pdf-link">
                <lucide-icon [img]="FileTextIcon" size="14"></lucide-icon> View PDF
              </a>
              <!-- Details entry on the Halal Bourse card only: shown for every stock with
                   sufficient data. -->
              <ng-container *ngIf="isHalalBourseCard(op)">
                <button type="button" class="details-button" *ngIf="showDetailsButton" (click)="openStandardsDialog($event)">
                  عرض التفاصيل
                </button>
              </ng-container>
            </ng-container>
          </div>

          <!-- 8th card: EGX33 Shariah index membership (informational, not a board opinion) -->
          <div class="source-card"
               [class.compliant]="isEGX33Constituent"
               [class.no-opinion]="!isEGX33Constituent">
            <div class="source-top">
              <strong>مؤشر الشريعة EGX33</strong>
            </div>
            <ng-container *ngIf="isEGX33Constituent">
              <div class="verdict-badge">ضمن مؤشر الشريعة EGX33</div>
              <p class="verdict-note">السهم مدرج ضمن مكونات مؤشر الشريعة EGX33.</p>
            </ng-container>
            <ng-container *ngIf="!isEGX33Constituent">
              <div class="verdict-badge">غير مدرج في مؤشر الشريعة EGX33</div>
              <p class="verdict-note">السهم غير مدرج في مكونات مؤشر الشريعة EGX33 (قد يكون متوافقاً شرعياً لأسباب أخرى).</p>
            </ng-container>
          </div>
        </div>

        <!-- Dedicated Shariah Metrics Section (AAOIFI & S&P Breakdown).
             Visibility depends on WHY the stock is non-compliant, not on the status
             alone: hidden only for impermissible core business (activityCompliant ===
             false) and board-governed stocks. Permissible-activity stocks show it for
             every stored verdict (Compliant, NonCompliant, insufficient); with no data it shows
             "Data currently unavailable" instead of hiding silently. -->
        <div class="shariah-metrics-panel" *ngIf="shouldShowRatiosSection">
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
            </div>
          </div>

          <ng-container *ngIf="hasShariahMetricsData; else metricsUnavailable">
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
          </ng-container>
          <ng-template #metricsUnavailable>
            <p class="muted" style="margin: 0;">Data currently unavailable — لا توجد حالياً بيانات النسب المالية الشرعية لهذا السهم.</p>
          </ng-template>
        </div>
        </ng-container>
      </section>

      <!-- Activity hard gate: when the company's own line of business is prohibited the
           stock is out at the first screening gate. Single verdict with the activity as
           the only reason — no 7-source opinion grid and no AAOIFI/S&P ratio panel. -->
      <section class="detail-card shariah-card activity-verdict-card" *ngIf="isActivityNonCompliant" appReveal>
        <div class="card-heading">
          <div>
            <span class="eyebrow">حُكم النشاط</span>
            <h2>غير متوافق مع الشريعة — النشاط: {{ activityClassificationLabel }}</h2>
          </div>
        </div>
        <p class="muted">
          Non-compliant due to the nature of its core business; financial screens are not applied.
        </p>
        <p class="muted">
          يستبعد السهم بوابة النشاط ذاتها، ولذلك لا تُعرض النسب المالية الشرعية ولا آراء
          الهيئات الشرعية.
        </p>
      </section>

      <!-- Quantitative standards dialog (Bourse Halal card "عرض التفاصيل").
           Accessible: role=dialog + aria-modal, focus trap, ESC/backdrop close,
           RTL, scrollable panel on mobile. -->
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

      <!-- Market Data Fundamentals (Only if stock has market data) -->
      <section class="detail-card market-card" *ngIf="marketData.hasMarketData !== false" appReveal>
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


  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private host: ElementRef<HTMLElement>
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.ticker = params.get('code') || '';
      if (this.ticker) {
        this.loadStockData();
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
    const c = this.marketData?.currency || '';
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
