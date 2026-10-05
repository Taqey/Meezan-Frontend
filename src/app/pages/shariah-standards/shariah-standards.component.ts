import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ShieldCheck, ArrowLeft } from 'lucide-angular';
import {
  CRITERION_LABELS,
  CRITERION_ORDER,
  SHARIAH_STANDARDS,
  scholarsDebtMax,
  type ShariahCriterionKey
} from '../../models/shariah-standards';

@Component({
  selector: 'app-shariah-standards',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="page-intro">
      <div>
        <span class="eyebrow">الشريعة والامتثال · مقارنة كمية</span>
        <h1>المعايير الشرعية</h1>
        <p>حدود الفحص المالي الكمي لأبرز معايير الشريعة المعتمدة، وكيف تُقيَّم نسب كل سهم مقابلها.</p>
      </div>
      <div class="intro-note">
        <lucide-icon [img]="ShieldCheckIcon" size="17"></lucide-icon>
        <span>{{ standards.length }} معايير مؤسسية + فتاوى علماء أفراد</span>
      </div>
    </div>

    <div class="detail-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">جدول المقارنة</span>
          <h2>حدود المعايير الشرعية الخمسة</h2>
        </div>
        <a routerLink="/stocks" class="back-link">
          <lucide-icon [img]="ArrowLeftIcon" size="15"></lucide-icon> العودة إلى الأسهم
        </a>
      </div>

      <div class="table-scroll">
        <table class="standards-table" aria-label="جدول مقارنة المعايير الشرعية">
          <thead>
            <tr>
              <th scope="col">المعيار <small>Standard</small></th>
              <th scope="col" *ngFor="let key of criterionOrder">
                {{ criterionLabels[key].ar }} <small>{{ criterionLabels[key].en }}</small>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of standards">
              <td>
                <strong class="std-name">{{ s.nameAr }}</strong>
                <span class="std-en">{{ s.nameEn }}</span>
                <span class="std-sub">{{ s.subtitleAr }}</span>
              </td>
              <td>≤ {{ s.prohibitedRevenueMax }}%</td>
              <td>≤ {{ s.debtMax }}%</td>
              <td>≤ {{ s.prohibitedInvestmentsMax }}%</td>
              <td>≤ {{ s.cashMax }}%</td>
            </tr>
            <tr class="scholars-row">
              <td>
                <strong class="std-name">فتاوى علماء أفراد</strong>
                <span class="std-en">Individual scholars</span>
                <span class="std-sub">اجتهادات فردية — غير معتمدة لدى معظم المؤسسات</span>
              </td>
              <td>—</td>
              <td>≤ {{ scholarsMax }}%</td>
              <td>—</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="scholars-note">
        فتاوى علماء أفراد تُجيز الاستثمار في الشركات التي تصل مديونيتها إلى {{ scholarsMax }}%،
        وهي غير معتمدة لدى معظم المؤسسات المالية الإسلامية.
      </p>
    </div>

    <div class="detail-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">دليل القراءة</span>
          <h2>شرح المعايير</h2>
        </div>
      </div>

      <div class="explainer-grid">
        <div class="explainer-cell">
          <strong>{{ criterionLabels['prohibitedRevenue'].ar }}</strong>
          <span>{{ criterionLabels['prohibitedRevenue'].en }}</span>
          <p>الإيرادات المحرمة ÷ إجمالي الإيرادات</p>
        </div>
        <div class="explainer-cell">
          <strong>{{ criterionLabels['debt'].ar }}</strong>
          <span>{{ criterionLabels['debt'].en }}</span>
          <p>الديون الربوية ÷ إجمالي الأصول أو القيمة السوقية</p>
        </div>
        <div class="explainer-cell">
          <strong>{{ criterionLabels['prohibitedInvestments'].ar }}</strong>
          <span>{{ criterionLabels['prohibitedInvestments'].en }}</span>
          <p>الاستثمارات المحرمة ÷ إجمالي الأصول</p>
        </div>
        <div class="explainer-cell">
          <strong>{{ criterionLabels['cash'].ar }}</strong>
          <span>{{ criterionLabels['cash'].en }}</span>
          <p>النقد والأصول السائلة ÷ إجمالي الأصول</p>
        </div>
      </div>

      <p class="muted explainer-note">
        هذه فحوص كمية فقط. يظل الفحص النوعي لنشاط الشركة مطبَّقاً
        (الخمور، القمار، البنوك التقليدية، وغيرها من الأنشطة المحرمة)،
        ويُنصح باستشارة جهة شرعية مؤهلة قبل اتخاذ أي قرار استثماري.
      </p>
    </div>
  `
})
export class ShariahStandardsComponent {
  readonly ShieldCheckIcon = ShieldCheck;
  readonly ArrowLeftIcon = ArrowLeft;

  readonly standards = SHARIAH_STANDARDS;
  readonly criterionOrder: readonly ShariahCriterionKey[] = CRITERION_ORDER;
  readonly criterionLabels = CRITERION_LABELS;
  readonly scholarsMax = scholarsDebtMax;
}
