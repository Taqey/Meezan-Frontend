import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../directives/reveal.directive';
import {
  LucideAngularModule,
  ShieldCheck,
  BookOpen,
  Calendar,
  Info,
  ChevronDown,
  TrendingUp
} from 'lucide-angular';
import {
  MzPageHeaderComponent,
  MzDetailsSectionComponent,
  MzBadgeComponent,
  MzButtonComponent
} from '../../components/ui';
import {
  FAISAL_SUB_ROW,
  PURIFICATION_APPROACHES,
  calculatePurification,
  type CalculatorApproach,
  type PurificationApproachId
} from '../../models/purification';

@Component({
  selector: 'app-purification',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    RevealDirective,
    MzPageHeaderComponent,
    MzDetailsSectionComponent,
    MzBadgeComponent,
    MzButtonComponent
  ],
  template: `
    <div class="mz mz-page purification-page">
      <mz-page-header
        badge="التطهير · دليل عملي"
        title="ما هو التطهير؟"
        description="التطهير أن تُخرج جزءاً صغيراً من عوائد استثمارك للفقراء، لتنقية مكسبك من أثر يسير من الإيرادات غير الجائزة التي قد تختلط بأرباح الشركة، مثل الفوائد.">
        <ng-container actions>
          <mz-badge tone="default" [pill]="true">
            <lucide-icon [img]="ShieldCheckIcon" [size]="15"></lucide-icon>
            <span>محتوى تعليمي فقط وليس فتوى</span>
          </mz-badge>
        </ng-container>
      </mz-page-header>

      <div class="mz-card pur-intro-sub">
        <p>التوافق يجيب عن سؤال: هل يجوز شراء السهم أصلاً؟ أما التطهير فيجيب عن سؤال آخر: كم أُخرج من العائد بعد تحققه؟</p>
      </div>

      <div class="mz-stack">
        <mz-details-section eyebrow="فروق مشروعة" title="ليه بتختلف الأرقام؟" appReveal>
          <div class="reasons-list">
            <div class="mz-card reason-item">
              <span class="reason-icon"><lucide-icon [img]="BookOpenIcon" size="18"></lucide-icon></span>
              <span>لكل جهة معيارها الخاص في الفحص والنسب التي تعتمدها.</span>
            </div>
            <div class="mz-card reason-item">
              <span class="reason-icon"><lucide-icon [img]="CalendarIcon" size="18"></lucide-icon></span>
              <span>القوائم المالية تتجدد في مواعيد مختلفة من جهة لأخرى.</span>
            </div>
            <div class="mz-card reason-item">
              <span class="reason-icon"><lucide-icon [img]="InfoIcon" size="18"></lucide-icon></span>
              <span>خلاف معتبر بين العلماء: هل تُطهَّر أرباح البيع مع التوزيعات أم لا؟</span>
            </div>
          </div>
          <p class="mz-source-note reasons-note">نعرض هذه المناهج كما هي دون ترجيح منهج على غيره.</p>
        </mz-details-section>

        <mz-details-section eyebrow="ثلاثة مداخل" title="طرق الحساب" appReveal>
          <div class="approach-accordion">
            <div class="mz-card approach-item" *ngFor="let a of approaches; let i = index" [class.is-open]="openApproach === a.id">
              <button type="button" class="approach-toggle"
                      [attr.aria-expanded]="openApproach === a.id"
                      [attr.aria-controls]="'approach-panel-' + a.id"
                      (click)="toggleApproach(a.id)">
                <span class="approach-letter">{{ letters[i] }}</span>
                <span class="approach-toggle-text">
                  <strong>{{ a.titleAr }}</strong>
                  <small>{{ a.bodies.join('، ') }}</small>
                </span>
                <span class="approach-chevron" [class.open]="openApproach === a.id">
                  <lucide-icon [img]="ChevronDownIcon" size="18"></lucide-icon>
                </span>
              </button>
              <div class="approach-panel" [id]="'approach-panel-' + a.id" *ngIf="openApproach === a.id">
                <p>{{ a.summaryAr }}</p>
                <p class="approach-formula"><span>المعادلة:</span> {{ a.formulaAr }}</p>
                <p class="muted approach-faisal-note" *ngIf="a.id === 'dividends-only'">{{ faisal.summaryAr }}</p>
              </div>
            </div>
          </div>
        </mz-details-section>

        <mz-details-section eyebrow="الخلاصة" title="باختصار" appReveal>
          <div class="mz-details-two summary-grid">
            <div class="mz-card summary-card">
              <div class="summary-card-head">
                <span class="summary-icon"><lucide-icon [img]="TrendingUpIcon" size="18"></lucide-icon></span>
                <h3>التوزيعات + الربح الرأسمالي</h3>
              </div>
              <p>يُطبَّق التطهير على التوزيعات وعلى أي ربح يتحقق من بيع الأسهم.</p>
              <div class="chip-row">
                <mz-badge tone="default" [pill]="true">أيوفي (AAOIFI)</mz-badge>
                <mz-badge tone="default" [pill]="true">إس آند بي (S&amp;P)</mz-badge>
                <mz-badge tone="default" [pill]="true">بورصة حلال</mz-badge>
                <mz-badge tone="default" [pill]="true">بنك فيصل الإسلامي</mz-badge>
              </div>
            </div>
            <div class="mz-card summary-card">
              <div class="summary-card-head">
                <span class="summary-icon"><lucide-icon [img]="InfoIcon" size="18"></lucide-icon></span>
                <h3>التوزيعات فقط</h3>
              </div>
              <p>يُطبَّق التطهير على التوزيعات وحدها دون أرباح البيع.</p>
              <div class="chip-row">
                <mz-badge tone="default" [pill]="true">مصفّى</mz-badge>
              </div>
            </div>
          </div>
        </mz-details-section>

        <mz-details-section eyebrow="احسب بنفسك" title="حاسبة التطهير" appReveal>
          <div class="calc-grid">
            <label class="calc-field">
              <span>التوزيعات المستلمة (جنيه)</span>
              <input class="mz-input pur-num-input" type="number" min="0" step="any" placeholder="1200"
                     [(ngModel)]="dividends" aria-label="التوزيعات المستلمة بالجنيه" />
            </label>
            <label class="calc-field">
              <span>الربح الرأسمالي عند البيع (جنيه)</span>
              <input class="mz-input pur-num-input" type="number" min="0" step="any" placeholder="300"
                     [(ngModel)]="capitalGain" aria-label="الربح الرأسمالي بالجنيه" />
            </label>
            <label class="calc-field">
              <span>نسبة التطهير (%)</span>
              <input class="mz-input pur-num-input" type="number" min="0" step="any" placeholder="2"
                     [(ngModel)]="ratioPct" aria-label="نسبة التطهير بالمئة" />
            </label>
          </div>
          <fieldset class="calc-approaches">
            <legend>طريقة الحساب</legend>
            <div class="calc-radios-grid">
              <label class="mz-card calc-radio" *ngFor="let a of calculatorOptions" [class.active]="calcApproach === a.id">
                <input type="radio" name="calcApproach" [value]="a.id" [(ngModel)]="calcApproach" />
                <span><strong>{{ a.titleAr }}</strong> <small class="muted">{{ a.formulaAr }}</small></span>
              </label>
            </div>
          </fieldset>
          <div class="calc-actions">
            <mz-button variant="default" (clicked)="resetCalculator()">تصفير الحقول</mz-button>
          </div>
          <div class="calc-result" [class.has-result]="calcResult !== null" aria-live="polite">
            <ng-container *ngIf="calcResult !== null; else calcHint">
              <span>مبلغ التطهير المستحق</span>
              <strong>{{ calcResult | number:'1.0-2' }} جنيه</strong>
              <small class="muted">{{ calcBreakdown }}</small>
            </ng-container>
            <ng-template #calcHint>
              <span class="muted">{{ calcTouched ? 'أدخل نسبة تطهير صحيحة (صفر أو أكثر) لعرض النتيجة.' : 'أدخل الأرقام أعلاه لعرض مبلغ التطهير.' }}</span>
            </ng-template>
          </div>
        </mz-details-section>

        <p class="mz-source-note page-footnote">الأمثلة والأرقام هنا للتوضيح فقط. هذا المحتوى تعليمي وليس فتوى، واستشر جهة شرعية موثوقة قبل العمل به.</p>
      </div>
    </div>
  `,
  styles: [`
    .pur-intro-sub {
      padding: 14px 18px;
      margin-top: -8px;
      margin-bottom: 20px;
      background: var(--mz-surface-low, #f2f3ff);
      border-color: rgba(188, 202, 192, 0.35);
    }
    .pur-intro-sub p {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--mz-on-surface-variant, #3d4a42);
    }
    .reasons-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
    @media (min-width: 768px) {
      .reasons-list {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    .reason-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: var(--mz-surface-low, #f2f3ff);
      font-size: 13.5px;
      font-weight: 600;
      color: var(--mz-on-surface, #131b2e);
    }
    .reason-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(151, 245, 204, 0.35);
      color: var(--mz-primary, #006948);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .reasons-note {
      margin: 14px 0 0;
      text-align: right;
    }
    .approach-accordion {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .approach-item {
      overflow: hidden;
      transition: border-color var(--mz-dur-fast, 140ms) var(--mz-ease, cubic-bezier(0.22, 1, 0.36, 1));
    }
    .approach-item.is-open {
      border-color: rgba(0, 105, 72, 0.45);
    }
    .approach-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border: 0;
      background: transparent;
      font-family: inherit;
      text-align: right;
      cursor: pointer;
      color: var(--mz-on-surface, #131b2e);
    }
    .approach-letter {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(151, 245, 204, 0.35);
      color: var(--mz-primary, #006948);
      font-size: 14px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .approach-toggle-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .approach-toggle-text strong {
      font-size: 15px;
      font-weight: 800;
    }
    .approach-toggle-text small {
      font-size: 12px;
      color: var(--mz-outline, #6d7a72);
    }
    .approach-chevron {
      display: inline-flex;
      color: var(--mz-outline, #6d7a72);
      transition: transform var(--mz-dur-base, 200ms) var(--mz-ease, cubic-bezier(0.22, 1, 0.36, 1));
    }
    .approach-chevron.open {
      transform: rotate(180deg);
      color: var(--mz-primary, #006948);
    }
    .approach-panel {
      padding: 0 16px 16px;
      border-top: 1px solid rgba(188, 202, 192, 0.25);
      padding-top: 12px;
      font-size: 13.5px;
      color: var(--mz-on-surface-variant, #3d4a42);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .approach-panel p {
      margin: 0;
    }
    .approach-formula {
      padding: 10px 14px;
      border-radius: 10px;
      background: var(--mz-surface-low, #f2f3ff);
      font-weight: 700;
      color: var(--mz-on-surface, #131b2e);
    }
    .approach-formula span {
      color: var(--mz-primary, #006948);
    }
    .approach-faisal-note {
      font-size: 12px;
      color: var(--mz-outline, #6d7a72);
    }
    .summary-card {
      padding: 18px;
      background: var(--mz-surface-low, #f2f3ff);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .summary-card-head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .summary-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: rgba(151, 245, 204, 0.35);
      color: var(--mz-primary, #006948);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .summary-card h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: var(--mz-on-surface, #131b2e);
    }
    .summary-card p {
      margin: 0;
      font-size: 13px;
      color: var(--mz-on-surface-variant, #3d4a42);
    }
    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: auto;
    }
    .calc-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }
    @media (min-width: 768px) {
      .calc-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    .calc-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .calc-field span {
      font-size: 13px;
      font-weight: 700;
      color: var(--mz-on-surface, #131b2e);
    }
    .pur-num-input {
      padding: 10px 14px;
    }
    .calc-approaches {
      border: 0;
      padding: 0;
      margin: 0 0 16px;
    }
    .calc-approaches legend {
      font-size: 13px;
      font-weight: 700;
      color: var(--mz-on-surface, #131b2e);
      margin-bottom: 8px;
    }
    .calc-radios-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    @media (min-width: 768px) {
      .calc-radios-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .calc-radio {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      cursor: pointer;
      background: var(--mz-bg, #faf8ff);
    }
    .calc-radio.active {
      border-color: var(--mz-primary, #006948);
      background: rgba(151, 245, 204, 0.16);
    }
    .calc-radio input[type="radio"] {
      accent-color: var(--mz-primary, #006948);
      margin-top: 4px;
    }
    .calc-radio span {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 13px;
    }
    .calc-radio small {
      color: var(--mz-outline, #6d7a72);
      font-size: 11.5px;
    }
    .calc-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }
    .calc-result {
      padding: 18px 20px;
      border-radius: 12px;
      background: var(--mz-surface-low, #f2f3ff);
      border: 1px solid rgba(188, 202, 192, 0.35);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      text-align: center;
    }
    .calc-result.has-result {
      background: rgba(151, 245, 204, 0.22);
      border-color: rgba(0, 105, 72, 0.35);
    }
    .calc-result span {
      font-size: 13px;
      font-weight: 700;
      color: var(--mz-on-surface-variant, #3d4a42);
    }
    .calc-result strong {
      font-size: 28px;
      font-weight: 900;
      color: var(--mz-primary, #006948);
    }
    .calc-result small {
      font-size: 12px;
      color: var(--mz-outline, #6d7a72);
      direction: ltr;
      unicode-bidi: embed;
    }
  `]
})
export class PurificationComponent {
  readonly ShieldCheckIcon = ShieldCheck;
  readonly BookOpenIcon = BookOpen;
  readonly CalendarIcon = Calendar;
  readonly InfoIcon = Info;
  readonly ChevronDownIcon = ChevronDown;
  readonly TrendingUpIcon = TrendingUp;

  readonly approaches = PURIFICATION_APPROACHES;
  readonly faisal = FAISAL_SUB_ROW;
  readonly letters = ['أ', 'ب', 'ج'];

  openApproach: PurificationApproachId | null = 'ownership';

  dividends: number | null = null;
  capitalGain: number | null = null;
  ratioPct: number | null = null;
  calcApproach: CalculatorApproach = 'received-profits';

  get calculatorOptions() {
    return this.approaches.filter((a) => a.id !== 'ownership');
  }

  get calcTouched(): boolean {
    return this.dividends != null || this.capitalGain != null || this.ratioPct != null;
  }

  get calcResult(): number | null {
    if (!this.calcTouched) return null;
    return calculatePurification(this.dividends, this.capitalGain, this.ratioPct, this.calcApproach);
  }

  get calcBreakdown(): string {
    const ratio = this.ratioPct ?? 0;
    if (this.calcApproach === 'received-profits') {
      return `${ratio}% × (${this.dividends ?? 0} + ${this.capitalGain ?? 0})`;
    }
    return `${ratio}% × ${this.dividends ?? 0}`;
  }

  toggleApproach(id: PurificationApproachId): void {
    this.openApproach = this.openApproach === id ? null : id;
  }

  resetCalculator(): void {
    this.dividends = null;
    this.capitalGain = null;
    this.ratioPct = null;
    this.calcApproach = 'received-profits';
  }
}
