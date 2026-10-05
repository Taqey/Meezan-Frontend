import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ShieldCheck,
  BookOpen,
  Calendar,
  Info,
  ChevronDown
} from 'lucide-angular';
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
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="page-intro">
      <div>
        <span class="eyebrow">التطهير · دليل عملي</span>
        <h1>ما هو التطهير؟</h1>
        <p>التطهير أن تُخرج جزءاً صغيراً من عوائد استثمارك للفقراء، لتنقية مكسبك من أثر يسير من الإيرادات غير الجائزة التي قد تختلط بأرباح الشركة، مثل الفوائد.</p>
        <p>التوافق يجيب عن سؤال: هل يجوز شراء السهم أصلاً؟ أما التطهير فيجيب عن سؤال آخر: كم أُخرج من العائد بعد تحققه؟</p>
      </div>
      <div class="intro-note">
        <lucide-icon [img]="ShieldCheckIcon" size="17"></lucide-icon>
        <span>محتوى تعليمي فقط وليس فتوى</span>
      </div>
    </div>

    <div class="detail-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">فروق مشروعة</span>
          <h2>ليه بتختلف الأرقام؟</h2>
        </div>
      </div>
      <div class="reasons-list">
        <div class="reason-item">
          <span class="reason-icon"><lucide-icon [img]="BookOpenIcon" size="17"></lucide-icon></span>
          <span>لكل جهة معيارها الخاص في الفحص والنسب التي تعتمدها.</span>
        </div>
        <div class="reason-item">
          <span class="reason-icon"><lucide-icon [img]="CalendarIcon" size="17"></lucide-icon></span>
          <span>القوائم المالية تتجدد في مواعيد مختلفة من جهة لأخرى.</span>
        </div>
        <div class="reason-item">
          <span class="reason-icon"><lucide-icon [img]="InfoIcon" size="17"></lucide-icon></span>
          <span>خلاف معتبر بين العلماء: هل تُطهَّر أرباح البيع مع التوزيعات أم لا؟</span>
        </div>
      </div>
      <p class="muted reasons-note">نعرض هذه المناهج كما هي دون ترجيح منهج على غيره.</p>
    </div>

    <div class="detail-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">ثلاثة مداخل</span>
          <h2>طرق الحساب</h2>
        </div>
      </div>
      <div class="approach-accordion">
        <div class="approach-item" *ngFor="let a of approaches; let i = index">
          <button type="button" class="approach-toggle"
                  [attr.aria-expanded]="openApproach === a.id"
                  [attr.aria-controls]="'approach-panel-' + a.id"
                  (click)="toggleApproach(a.id)">
            <span class="approach-letter">{{ letters[i] }}</span>
            <span class="approach-toggle-text">
              <strong>{{ a.titleAr }}</strong>
              <small>{{ a.bodies.join('، ') }}</small>
            </span>
            <lucide-icon [img]="ChevronDownIcon" size="17" [class.open]="openApproach === a.id"></lucide-icon>
          </button>
          <div class="approach-panel" [id]="'approach-panel-' + a.id" *ngIf="openApproach === a.id">
            <p>{{ a.summaryAr }}</p>
            <p class="approach-formula"><span>المعادلة:</span> {{ a.formulaAr }}</p>
            <p class="muted approach-faisal-note" *ngIf="a.id === 'dividends-only'">{{ faisal.summaryAr }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">مقارنة سريعة</span>
          <h2>المداخل الثلاثة في جدول</h2>
        </div>
      </div>
      <div class="table-scroll">
        <table class="standards-table" aria-label="جدول مقارنة مداخل التطهير">
          <thead>
            <tr>
              <th scope="col">الأسلوب</th>
              <th scope="col">يشمل التوزيعات</th>
              <th scope="col">يشمل الربح الرأسمالي</th>
              <th scope="col">من يتبعه</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of approaches">
              <td><strong class="std-name">{{ a.titleAr }}</strong></td>
              <td><span class="yes-no" [class.yes]="a.includesDividends" [class.no]="!a.includesDividends">{{ a.includesDividends ? 'نعم' : 'لا' }}</span></td>
              <td><span class="yes-no" [class.yes]="a.includesCapitalGain" [class.no]="!a.includesCapitalGain">{{ a.includesCapitalGain ? 'نعم' : 'لا' }}</span></td>
              <td>{{ a.bodies.join('، ') }}</td>
            </tr>
            <tr class="scholars-row sub-row">
              <td><strong class="std-name">{{ faisal.titleAr }}</strong></td>
              <td><span class="yes-no yes">نعم</span></td>
              <td><span class="yes-no yes">نعم</span></td>
              <td>{{ faisal.bodies.join('، ') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="detail-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">احسب بنفسك</span>
          <h2>حاسبة التطهير</h2>
        </div>
      </div>
      <div class="calc-grid">
        <label class="calc-field">
          <span>التوزيعات المستلمة (جنيه)</span>
          <input type="number" min="0" step="any" placeholder="1200"
                 [(ngModel)]="dividends" aria-label="التوزيعات المستلمة بالجنيه" />
        </label>
        <label class="calc-field">
          <span>الربح الرأسمالي عند البيع (جنيه)</span>
          <input type="number" min="0" step="any" placeholder="300"
                 [(ngModel)]="capitalGain" aria-label="الربح الرأسمالي بالجنيه" />
        </label>
        <label class="calc-field">
          <span>نسبة التطهير (%)</span>
          <input type="number" min="0" step="any" placeholder="2"
                 [(ngModel)]="ratioPct" aria-label="نسبة التطهير بالمئة" />
        </label>
      </div>
      <fieldset class="calc-approaches">
        <legend>طريقة الحساب</legend>
        <label class="calc-radio" *ngFor="let a of calculatorOptions">
          <input type="radio" name="calcApproach" [value]="a.id" [(ngModel)]="calcApproach" />
          <span><strong>{{ a.titleAr }}</strong> <small class="muted">{{ a.formulaAr }}</small></span>
        </label>
      </fieldset>
      <div class="calc-actions">
        <button type="button" class="btn btn-outline btn-sm" (click)="resetCalculator()">تصفير الحقول</button>
      </div>
      <div class="calc-result" aria-live="polite">
        <ng-container *ngIf="calcResult !== null; else calcHint">
          <span>مبلغ التطهير المستحق</span>
          <strong>{{ calcResult | number:'1.0-2' }} جنيه</strong>
          <small class="muted">{{ calcBreakdown }}</small>
        </ng-container>
        <ng-template #calcHint>
          <span class="muted">{{ calcTouched ? 'أدخل نسبة تطهير صحيحة (صفر أو أكثر) لعرض النتيجة.' : 'أدخل الأرقام أعلاه لعرض مبلغ التطهير.' }}</span>
        </ng-template>
      </div>
    </div>

    <p class="muted page-footnote">الأمثلة والأرقام هنا للتوضيح فقط. هذا المحتوى تعليمي وليس فتوى، واستشر جهة شرعية موثوقة قبل العمل به.</p>
  `
})
export class PurificationComponent {
  readonly ShieldCheckIcon = ShieldCheck;
  readonly BookOpenIcon = BookOpen;
  readonly CalendarIcon = Calendar;
  readonly InfoIcon = Info;
  readonly ChevronDownIcon = ChevronDown;

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
