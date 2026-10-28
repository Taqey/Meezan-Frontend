import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ShieldCheck } from 'lucide-angular';
import { RevealDirective } from '../../directives/reveal.directive';
import {
  MzPageHeaderComponent,
  MzDetailsSectionComponent,
  MzBadgeComponent
} from '../../components/ui';
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
  imports: [
    CommonModule,
    LucideAngularModule,
    RevealDirective,
    MzPageHeaderComponent,
    MzDetailsSectionComponent,
    MzBadgeComponent
  ],
  template: `
    <div class="mz mz-page shariah-standards-page">
      <mz-page-header
        badge="الشريعة والامتثال · مقارنة كمية"
        title="المعايير الشرعية"
        description="حدود الفحص المالي الكمي لأبرز معايير الشريعة المعتمدة، وكيف تُقيَّم نسب كل سهم مقابلها.">
        <ng-container actions>
          <mz-badge tone="default" [pill]="true">
            <lucide-icon [img]="ShieldCheckIcon" [size]="15"></lucide-icon>
            <span>{{ standards.length }} معايير مؤسسية + فتاوى علماء أفراد</span>
          </mz-badge>
        </ng-container>
      </mz-page-header>

      <div class="mz-stack">
        <mz-details-section eyebrow="جدول المقارنة" title="حدود المعايير الشرعية الخمسة" appReveal>
          <div class="mz-table-scroll">
            <table class="mz-std-table standards-table" aria-label="جدول مقارنة المعايير الشرعية">
              <thead>
                <tr>
                  <th scope="col">المعيار <small>Standard</small></th>
                  <th scope="col" *ngFor="let key of criterionOrder">
                    {{ criterionLabels[key].ar }} <small>{{ criterionLabels[key].en }}</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of standards; let i = index" [style.--item-index]="i">
                  <td>
                    <strong class="std-name">{{ s.nameAr }}</strong>
                    <span class="std-en">{{ s.nameEn }}</span>
                    <span class="std-sub">{{ s.subtitleAr }}</span>
                  </td>
                  <td [attr.data-label]="criterionLabels['prohibitedRevenue'].ar"><span class="mz-std-pill"><bdi dir="ltr">≤ {{ s.prohibitedRevenueMax }}%</bdi></span></td>
                  <td [attr.data-label]="criterionLabels['debt'].ar"><span class="mz-std-pill"><bdi dir="ltr">≤ {{ s.debtMax }}%</bdi></span></td>
                  <td [attr.data-label]="criterionLabels['prohibitedInvestments'].ar"><span class="mz-std-pill"><bdi dir="ltr">≤ {{ s.prohibitedInvestmentsMax }}%</bdi></span></td>
                  <td [attr.data-label]="criterionLabels['cash'].ar"><span class="mz-std-pill"><bdi dir="ltr">≤ {{ s.cashMax }}%</bdi></span></td>
                </tr>
                <tr class="scholars-row">
                  <td>
                    <strong class="std-name">فتاوى علماء أفراد</strong>
                    <span class="std-en">Individual scholars</span>
                    <span class="std-sub">اجتهادات فردية — غير معتمدة لدى معظم المؤسسات</span>
                  </td>
                  <td [attr.data-label]="criterionLabels['prohibitedRevenue'].ar"><span class="mz-std-dash">—</span></td>
                  <td [attr.data-label]="criterionLabels['debt'].ar"><span class="mz-std-pill warn"><bdi dir="ltr">≤ {{ scholarsMax }}%</bdi></span></td>
                  <td [attr.data-label]="criterionLabels['prohibitedInvestments'].ar"><span class="mz-std-dash">—</span></td>
                  <td [attr.data-label]="criterionLabels['cash'].ar"><span class="mz-std-dash">—</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="scholars-note">
            فتاوى علماء أفراد تُجيز الاستثمار في الشركات التي تصل مديونيتها إلى {{ scholarsMax }}%،
            وهي غير معتمدة لدى معظم المؤسسات المالية الإسلامية.
          </p>
        </mz-details-section>

        <mz-details-section eyebrow="دليل القراءة" title="شرح المعايير" appReveal>
          <div class="mz-infogrid explainer-grid">
            <div class="mz-card mz-infocard explainer-cell">
              <strong class="mz-infocard-title">{{ criterionLabels['prohibitedRevenue'].ar }}</strong>
              <span class="mz-infocard-label">{{ criterionLabels['prohibitedRevenue'].en }}</span>
              <p class="mz-infocard-desc">الإيرادات المحرمة ÷ إجمالي الإيرادات</p>
            </div>
            <div class="mz-card mz-infocard explainer-cell">
              <strong class="mz-infocard-title">{{ criterionLabels['debt'].ar }}</strong>
              <span class="mz-infocard-label">{{ criterionLabels['debt'].en }}</span>
              <p class="mz-infocard-desc">الديون الربوية ÷ إجمالي الأصول أو القيمة السوقية</p>
            </div>
            <div class="mz-card mz-infocard explainer-cell">
              <strong class="mz-infocard-title">{{ criterionLabels['prohibitedInvestments'].ar }}</strong>
              <span class="mz-infocard-label">{{ criterionLabels['prohibitedInvestments'].en }}</span>
              <p class="mz-infocard-desc">الاستثمارات المحرمة ÷ إجمالي الأصول</p>
            </div>
            <div class="mz-card mz-infocard explainer-cell">
              <strong class="mz-infocard-title">{{ criterionLabels['cash'].ar }}</strong>
              <span class="mz-infocard-label">{{ criterionLabels['cash'].en }}</span>
              <p class="mz-infocard-desc">النقد والأصول السائلة ÷ إجمالي الأصول</p>
            </div>
          </div>

          <p class="mz-source-note explainer-note">
            هذه فحوص كمية فقط. يظل الفحص النوعي لنشاط الشركة مطبَّقاً
            (الخمور، القمار، البنوك التقليدية، وغيرها من الأنشطة المحرمة)،
            ويُنصح باستشارة جهة شرعية مؤهلة قبل اتخاذ أي قرار استثماري.
          </p>
        </mz-details-section>
      </div>
    </div>
  `,
  styles: [`
    .mz-table-scroll {
      overflow-x: auto;
      border: 1px solid rgba(188, 202, 192, 0.35);
      border-radius: 12px;
      background: var(--mz-surface, #fff);
    }
    .mz-std-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .mz-std-table thead th {
      background: var(--mz-surface-low, #f2f3ff);
      color: var(--mz-on-surface, #131b2e);
      font-weight: 800;
      text-align: right;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(188, 202, 192, 0.4);
      vertical-align: top;
    }
    .mz-std-table thead th small {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: var(--mz-outline, #6d7a72);
      margin-top: 2px;
    }
    .mz-std-table tbody td {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(188, 202, 192, 0.25);
      vertical-align: middle;
    }
    .mz-std-table tbody tr:last-child td {
      border-bottom: 0;
    }
    .mz-std-table tbody tr:hover {
      background: rgba(242, 243, 255, 0.55);
    }
    .mz-std-table .std-name {
      display: block;
      font-size: 15px;
      font-weight: 800;
      color: var(--mz-on-surface, #131b2e);
    }
    .mz-std-table .std-en {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: var(--mz-primary, #006948);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 2px;
    }
    .mz-std-table .std-sub {
      display: block;
      font-size: 12px;
      color: var(--mz-outline, #6d7a72);
      margin-top: 2px;
    }
    .mz-std-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 800;
      background: rgba(151, 245, 204, 0.28);
      color: var(--mz-secondary, #006c4e);
      font-variant-numeric: tabular-nums;
    }
    .mz-std-pill.warn {
      background: var(--mz-warn-soft, #fff4d9);
      color: var(--mz-warn, #b47b20);
    }
    .mz-std-dash {
      color: var(--mz-outline, #6d7a72);
      font-weight: 700;
    }
    .scholars-row {
      background: rgba(255, 244, 217, 0.22);
    }
    .scholars-note {
      margin: 14px 0 0;
      padding: 12px 16px;
      border-radius: 10px;
      background: var(--mz-surface-low, #f2f3ff);
      border: 1px solid rgba(188, 202, 192, 0.3);
      font-size: 13px;
      font-weight: 500;
      color: var(--mz-on-surface-variant, #3d4a42);
    }
    .explainer-note {
      margin: 16px 0 0;
      text-align: right;
      padding: 12px 16px;
      border-radius: 10px;
      background: var(--mz-surface-low, #f2f3ff);
      border: 1px solid rgba(188, 202, 192, 0.3);
    }
    @media (max-width: 767px) {
      .mz-std-table thead {
        display: none;
      }
      .mz-std-table, .mz-std-table tbody, .mz-std-table tr, .mz-std-table td {
        display: block;
        width: 100%;
      }
      .mz-std-table tr {
        padding: 12px;
        border-bottom: 1px solid rgba(188, 202, 192, 0.35);
      }
      .mz-std-table td {
        padding: 6px 4px;
        border-bottom: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .mz-std-table td:first-child {
        display: block;
        padding-bottom: 10px;
        margin-bottom: 6px;
        border-bottom: 1px dashed rgba(188, 202, 192, 0.35);
      }
      .mz-std-table td[data-label]::before {
        content: attr(data-label);
        font-size: 12px;
        font-weight: 700;
        color: var(--mz-on-surface-variant, #3d4a42);
      }
    }
  `]
})
export class ShariahStandardsComponent {
  readonly ShieldCheckIcon = ShieldCheck;

  readonly standards = SHARIAH_STANDARDS;
  readonly criterionOrder: readonly ShariahCriterionKey[] = CRITERION_ORDER;
  readonly criterionLabels = CRITERION_LABELS;
  readonly scholarsMax = scholarsDebtMax;
}
