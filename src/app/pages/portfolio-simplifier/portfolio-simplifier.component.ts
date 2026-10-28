import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, PieChart, Info, Copy, RotateCcw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-angular';
import { PortfolioSimplifierService, CalculationResult, MethodResult } from '../../services/portfolio-simplifier.service';
import { InvestorProfile } from './portfolio-config.data';
import { PORTFOLIO_SOURCES, PortfolioSource } from './portfolio-sources.data';
import { PortfolioDonutChartComponent } from './portfolio-donut-chart.component';
import { ToastService } from '../../services/toast.service';
import {
  MzPageHeaderComponent,
  MzDetailsSectionComponent,
  MzBadgeComponent,
  MzButtonComponent,
  MzBackLinkComponent
} from '../../components/ui';

@Component({
  selector: 'app-portfolio-simplifier',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    PortfolioDonutChartComponent,
    MzPageHeaderComponent,
    MzDetailsSectionComponent,
    MzBadgeComponent,
    MzButtonComponent,
    MzBackLinkComponent
  ],
  template: `
    <div class="mz mz-page portfolio-simplifier-page">
      <!-- Breadcrumbs -->
      <mz-back-link to="/" label="الرئيسية"></mz-back-link>

      <!-- Page Hero -->
      <mz-page-header
        badge="أدوات الاستثمار الذكية · EGX Simplifier"
        title="مُبسط محفظة البورصة المصرية (EGX)"
        description="ابنِ محفظتك الاستثمارية الذكية بالجمع بين توزيع الأصول ومنهجية الكور-ساتلايت (Core-Satellite) بطريقة مبسطة ومتوافقة مع السوق المصري.">
        <ng-container actions>
          <mz-badge tone="default" [pill]="true">
            <lucide-icon [img]="PieChartIcon" [size]="15"></lucide-icon>
            <span>Core-Satellite + Asset Allocation</span>
          </mz-badge>
        </ng-container>
      </mz-page-header>

      <div class="mz-stack">
        <!-- Input Form Card -->
        <mz-details-section eyebrow="معطيات المستثمر" title="حدد أهدافك وملفك الاستثماري">
          <div class="form-grid">
            <!-- Input 1: Age -->
            <div class="form-group">
              <label for="ageInput">1. السن (من 18 إلى 80 سنة):</label>
              <input
                type="number"
                id="ageInput"
                class="mz-input form-control"
                [(ngModel)]="age"
                min="18"
                max="80"
                placeholder="مثال: 35">
              <div *ngIf="ageError" class="field-error">الرجاء إدخال سن صحيح بين 18 و 80 سنة.</div>
            </div>

            <!-- Input 2: Investor Type -->
            <div class="form-group">
              <label>2. نوع المستثمر:</label>
              <div class="profile-chips">
                <button
                  type="button"
                  class="mz-chip chip-btn"
                  [class.active]="selectedProfile === 'Conservative'"
                  (click)="selectedProfile = 'Conservative'">
                  تحفظي (Conservative)
                </button>
                <button
                  type="button"
                  class="mz-chip chip-btn"
                  [class.active]="selectedProfile === 'Balanced'"
                  (click)="selectedProfile = 'Balanced'">
                  متوازن (Balanced)
                </button>
                <button
                  type="button"
                  class="mz-chip chip-btn"
                  [class.active]="selectedProfile === 'Aggressive'"
                  (click)="selectedProfile = 'Aggressive'">
                  هجومي (Aggressive)
                </button>
              </div>
              <div *ngIf="profileError" class="field-error">الرجاء اختيار نوع المستثمر (تحفظي، متوازن، أو هجومي).</div>
            </div>

            <!-- Input 3: Gold Toggle -->
            <div class="form-group">
              <label>3. إضافة الذهب للمحفظة؟</label>
              <div class="gold-toggle-row">
                <label class="switch-control">
                  <input type="checkbox" [(ngModel)]="includeGold">
                  <span class="switch-slider"></span>
                </label>
                <span class="switch-label">
                  {{ includeGold ? 'نعم (تحدد النسبة تلقائياً حسب نوع المستثمر)' : 'لا' }}
                </span>
                <button type="button" class="source-link-btn" (click)="scrollToSource('gold_pct')">
                  <lucide-icon [img]="InfoIcon" size="14"></lucide-icon>
                  <span>المصدر</span>
                </button>
              </div>
            </div>

            <!-- Input 4: Total Amount (Optional) -->
            <div class="form-group">
              <label for="amountInput">4. إجمالي المبلغ بالجنيه المصري (اختياري):</label>
              <input
                type="number"
                id="amountInput"
                class="mz-input form-control"
                [(ngModel)]="totalAmount"
                placeholder="مثال: 100000">
            </div>
          </div>

          <div class="form-actions">
            <mz-button variant="primary" (clicked)="calculate()">احسب المحفظة</mz-button>
            <mz-button variant="default" [icon]="RotateCcwIcon" (clicked)="reset()">إعادة ضبط</mz-button>
          </div>
        </mz-details-section>

        <!-- Results Section -->
        <section #resultsSection class="results-wrapper mz-stack" *ngIf="result">
          <!-- Fidelity Notice Banner -->
          <div class="mz-card info-banner">
            <lucide-icon [img]="InfoIcon" size="18"></lucide-icon>
            <div class="banner-text">
              <span>Defensive = stable demand during downturns; Growth = benefits more from economic expansion (based on Fidelity's classification).</span>
            </div>
            <button type="button" class="source-link-btn" (click)="scrollToSource('defensive_vs_growth')">
              <span>المصدر</span>
            </button>
          </div>

          <!-- Methods Cards Grid -->
          <div class="methods-grid">
            <div class="mz-card method-card" *ngFor="let method of result.methods; let i = index">
              <div class="method-card-header">
                <h3 class="method-title">{{ method.name }}</h3>
                <button type="button" class="source-link-btn" (click)="scrollToSource(method.sourceTopicKeys[0] || 'core_satellite_ratios')">
                  <lucide-icon [img]="InfoIcon" size="13"></lucide-icon>
                  <span>المصدر</span>
                </button>
              </div>

              <div class="method-content-row">
                <div class="method-legend">
                  <ul class="legend-list">
                    <li *ngFor="let it of method.items">
                      <span class="legend-dot" [style.background-color]="it.color"></span>
                      <strong class="legend-pct">{{ it.rounded }}%</strong>
                      <span class="legend-label">{{ it.label }}</span>
                      <span *ngIf="it.amount" class="legend-amount">({{ formatCurrency(it.amount) }} ج.م)</span>
                      <div *ngIf="it.hint" class="sat-hint-box" [innerHTML]="it.hint"></div>
                    </li>
                  </ul>
                </div>

                <div class="method-chart">
                  <app-portfolio-donut-chart [items]="method.items"></app-portfolio-donut-chart>
                </div>
              </div>

              <!-- Details Toggle -->
              <button type="button" class="details-toggle-btn" (click)="toggleDetails(i)">
                <span>{{ expandedMethods[i] ? 'إخفاء التفاصيل' : 'عرض التفاصيل' }}</span>
                <lucide-icon [img]="expandedMethods[i] ? ChevronUpIcon : ChevronDownIcon" size="15"></lucide-icon>
              </button>

              <!-- Expanded Details Content -->
              <div class="details-drawer" *ngIf="expandedMethods[i]">
                <div class="steps-box">
                  <h4>خطوات الحساب:</h4>
                  <ol>
                    <li>نسبة الذهب: {{ result.includeGold ? (method.goldPct * 100) + '%' : '0%' }} ← المتبقي للاستثمار: {{ (method.remainder * 100) }}%</li>
                    <li>توزيع الأسهم والسندات من المتبقي: أسهم {{ (method.stocksRatio * 100).toFixed(1) }}%، سندات {{ (method.bondsRatio * 100).toFixed(1) }}%</li>
                    <li>تطبيق الكور-ساتلايت على الأسهم ({{ (method.stocksPortionOfTotal * 100).toFixed(1) }}%): صندوق مؤشرات Core {{ (method.coreSharePct * 100) }}% = {{ (method.corePortionOfTotal * 100).toFixed(1) }}%، وساتلايت Satellite {{ (method.satSharePct * 100) }}% = {{ (method.satellitePortionOfTotal * 100).toFixed(1) }}%</li>
                  </ol>
                </div>

                <div class="pros-cons-box">
                  <div class="pros">
                    <strong>المميزات:</strong> {{ method.adv }}
                  </div>
                  <div class="cons">
                    <strong>العيوب:</strong> {{ method.dis }}
                  </div>
                </div>

                <div class="related-sources">
                  <strong>المصادر المتعلقة:</strong>
                  <span class="source-tags">
                    <button
                      *ngFor="let k of getRelatedSourceKeys(method)"
                      type="button"
                      class="tag-btn"
                      (click)="scrollToSource(k)">
                      ℹ️ {{ getSourceShortTitle(k) }}
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- General Notes & Disclaimer -->
          <mz-details-section eyebrow="إخلاء مسؤولية وتوجيهات" title="ملاحظات هامة وإخلاء مسؤولية" class="general-notes-card">
            <ul class="notes-list">
              <li>
                نسب الكور/ساتلايت (80/20، 70/30، 60/40) مأخوذة من الصفحات التعليمية لشركات الوساطة ومصدرة الصناديق وليست دراسة أكاديمية بحتة، وهي بمثابة قاعدة تقريبية (Rule of thumb).
                <button type="button" class="source-inline-btn" (click)="scrollToSource('core_satellite_ratios')">ℹ️ المصدر</button>
              </li>
              <li>
                نسب الذهب المقترحة لكل نوع مستثمر هي افتراض تنظيمي توجيهي وليست من دراسة مرجعية مُلزمة.
                <button type="button" class="source-inline-btn" (click)="scrollToSource('gold_pct')">ℹ️ المصدر</button>
              </li>
              <li>
                طرق الأسهم والسندات أصلها أسواق أمريكية؛ وتطبيقها على البورصة المصرية (EGX) يعتبر تكييفاً محلياً للمفاهيم العالمية.
                <button type="button" class="source-inline-btn" (click)="scrollToSource('egx_adaptation')">ℹ️ المصدر</button>
              </li>
              <li>ارتفاع نسبة الساتلايت يعني زيادة المخاطر وتقليل التنويع الواسع في السوق.</li>
              <li>
                تصنيف القطاعات والتوجهات مستوحى من (Fidelity / Morningstar) كمرجعية إرشادية.
                <button type="button" class="source-inline-btn" (click)="scrollToSource('defensive_vs_growth')">ℹ️ المصدر</button>
              </li>
              <li>هذه الأداة تعليمية وتثقيفية بالدرجة الأولى وليست استشارة مالية أو توصية بيع أو شراء.</li>
            </ul>

            <div class="copy-actions-row">
              <mz-button variant="primary" [icon]="CopyIcon" (clicked)="copyResults()">نسخ النتائج</mz-button>
            </div>
          </mz-details-section>
        </section>

        <!-- Collapsible Sources Section -->
        <div class="mz-card sources-card">
          <div class="sources-toggle-header" (click)="sourcesExpanded = !sourcesExpanded">
            <div class="sources-title-group">
              <span class="mz-eyebrow">المراجع والأدبيات</span>
              <h2>📚 المصادر والتفاصيل (Sources &amp; Details)</h2>
            </div>
            <button type="button" class="toggle-icon-btn" [attr.aria-expanded]="sourcesExpanded">
              <lucide-icon [img]="sourcesExpanded ? ChevronUpIcon : ChevronDownIcon" size="20"></lucide-icon>
            </button>
          </div>

          <div class="sources-body" *ngIf="sourcesExpanded">
            <p class="sources-intro-note">
              الملخصات بصياغتنا، وليست اقتباسات حرفية إلا إذا وُضعت بين علامات تنصيص. يُرجى الرجوع للمصدر الأصلي.
            </p>

            <div class="source-blocks-list">
              <div
                *ngFor="let entry of sourcesEntries"
                class="source-block-item"
                [id]="'source_block_' + entry.key"
                [class.highlight]="highlightedSource === entry.key">
                <div class="source-block-head" (click)="toggleSourceItem(entry.key)">
                  <div class="source-head-info">
                    <span class="source-block-title">{{ entry.source.title }}</span>
                    <span class="strength-badge" [ngClass]="entry.source.strength">
                      {{ entry.source.strengthText }}
                    </span>
                  </div>
                  <lucide-icon [img]="expandedSourceItems[entry.key] ? ChevronUpIcon : ChevronDownIcon" size="16"></lucide-icon>
                </div>

                <div class="source-block-details" *ngIf="expandedSourceItems[entry.key]">
                  <p class="source-summary">{{ entry.source.summary }}</p>
                  <blockquote *ngIf="entry.source.quote" class="source-quote">
                    "{{ entry.source.quote }}"
                  </blockquote>
                  <div class="source-links-box" *ngIf="entry.source.links.length > 0">
                    <strong>الروابط المباشرة:</strong>
                    <div class="links-flex">
                      <a
                        *ngFor="let link of entry.source.links; let lIdx = index"
                        [href]="link"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="source-ext-link">
                        <span>[رابط {{ lIdx + 1 }}]</span>
                        <lucide-icon [img]="ExternalLinkIcon" size="12"></lucide-icon>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .portfolio-simplifier-page {
      padding-bottom: 64px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 8px;
    }
    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-group label {
      font-weight: 700;
      font-size: 13.5px;
      color: var(--mz-on-surface, #131b2e);
    }
    .form-control {
      padding: 10px 14px;
    }
    .profile-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chip-btn {
      flex: 1;
      text-align: center;
      justify-content: center;
      padding: 9px 12px;
    }
    .gold-toggle-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
    }
    .switch-control {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
      flex-shrink: 0;
    }
    .switch-control input {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    }
    .switch-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: var(--mz-outline-variant, #bccac0);
      transition: .25s ease;
      border-radius: 26px;
    }
    .switch-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .25s ease;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .switch-control input:checked + .switch-slider {
      background-color: var(--mz-primary, #006948);
    }
    .switch-control input:checked + .switch-slider:before {
      transform: translateX(22px);
    }
    .switch-label {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--mz-on-surface, #131b2e);
    }
    .source-link-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--mz-surface-low, #f2f3ff);
      border: 1px solid rgba(188, 202, 192, 0.4);
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--mz-primary, #006948);
      cursor: pointer;
      font-family: inherit;
      transition: background var(--mz-dur-fast, 140ms);
    }
    .source-link-btn:hover {
      background: rgba(151, 245, 204, 0.3);
    }
    .field-error {
      color: var(--mz-error, #ba1a1a);
      font-size: 12px;
      font-weight: 600;
      margin-top: 2px;
    }
    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid rgba(188, 202, 192, 0.3);
    }
    .info-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 18px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      color: #1e3a8a;
      font-size: 13px;
    }
    .banner-text {
      flex: 1;
      font-weight: 500;
    }
    .methods-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }
    @media (max-width: 600px) {
      .methods-grid {
        grid-template-columns: 1fr;
      }
    }
    .method-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
      padding: 20px;
    }
    .method-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(188, 202, 192, 0.3);
    }
    .method-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--mz-on-surface, #131b2e);
      margin: 0;
    }
    .method-content-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    @media (max-width: 450px) {
      .method-content-row {
        flex-direction: column;
        align-items: stretch;
      }
    }
    .method-legend {
      flex: 1;
    }
    .legend-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .legend-list li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      flex-wrap: wrap;
    }
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
      margin-top: 4px;
    }
    .legend-pct {
      color: var(--mz-on-surface, #131b2e);
      font-weight: 800;
    }
    .legend-label {
      color: var(--mz-on-surface-variant, #3d4a42);
      font-weight: 600;
    }
    .legend-amount {
      color: var(--mz-outline, #6d7a72);
      font-size: 12px;
      font-weight: 600;
    }
    .sat-hint-box {
      width: 100%;
      margin-top: 4px;
      margin-right: 20px;
      font-size: 11px;
      color: var(--mz-on-surface-variant, #3d4a42);
      background: var(--mz-surface-low, #f2f3ff);
      padding: 6px 10px;
      border-radius: 8px;
      line-height: 1.5;
    }
    .details-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      margin-top: 16px;
      padding: 8px;
      background: var(--mz-surface-low, #f2f3ff);
      border: 1px solid rgba(188, 202, 192, 0.35);
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--mz-primary, #006948);
      cursor: pointer;
      font-family: inherit;
    }
    .details-drawer {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px dashed rgba(188, 202, 192, 0.4);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .steps-box h4 {
      font-size: 13px;
      font-weight: 800;
      margin: 0 0 6px;
      color: var(--mz-on-surface, #131b2e);
    }
    .steps-box ol {
      padding-right: 18px;
      margin: 0;
      font-size: 12px;
      color: var(--mz-on-surface-variant, #3d4a42);
      line-height: 1.7;
    }
    .pros-cons-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      line-height: 1.6;
    }
    .pros {
      color: var(--mz-secondary, #006c4e);
      font-weight: 600;
    }
    .cons {
      color: var(--mz-warn, #b47b20);
      font-weight: 600;
    }
    .related-sources {
      font-size: 12px;
      margin-top: 4px;
    }
    .source-tags {
      display: inline-flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-right: 6px;
    }
    .tag-btn {
      background: var(--mz-surface-low, #f2f3ff);
      border: 1px solid rgba(188, 202, 192, 0.4);
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
      color: var(--mz-primary, #006948);
      cursor: pointer;
      font-family: inherit;
    }
    .notes-list {
      padding-right: 20px;
      margin: 0;
      color: var(--mz-on-surface-variant, #3d4a42);
      font-size: 13px;
      line-height: 1.8;
    }
    .source-inline-btn {
      background: transparent;
      border: none;
      color: var(--mz-primary, #006948);
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      text-decoration: underline;
      padding: 0 4px;
      font-family: inherit;
    }
    .copy-actions-row {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
    .sources-card {
      padding: 20px;
    }
    .sources-toggle-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
    }
    .sources-title-group h2 {
      margin: 4px 0 0;
      font-size: 18px;
      font-weight: 800;
      color: var(--mz-on-surface, #131b2e);
    }
    .toggle-icon-btn {
      background: var(--mz-surface-low, #f2f3ff);
      border: 1px solid rgba(188, 202, 192, 0.4);
      border-radius: 8px;
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      cursor: pointer;
      color: var(--mz-primary, #006948);
    }
    .sources-intro-note {
      font-size: 13px;
      color: var(--mz-outline, #6d7a72);
      margin: 14px 0 18px;
      padding: 10px 14px;
      background: var(--mz-surface-low, #f2f3ff);
      border-radius: 8px;
    }
    .source-blocks-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .source-block-item {
      border: 1px solid rgba(188, 202, 192, 0.35);
      border-radius: 12px;
      overflow: hidden;
      transition: border-color var(--mz-dur-fast, 140ms), box-shadow var(--mz-dur-fast, 140ms);
    }
    .source-block-item.highlight {
      border-color: var(--mz-primary, #006948);
      box-shadow: 0 0 0 2px rgba(0, 105, 72, 0.25);
    }
    .source-block-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: var(--mz-surface, #fff);
      cursor: pointer;
    }
    .source-head-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .source-block-title {
      font-weight: 700;
      font-size: 14px;
      color: var(--mz-on-surface, #131b2e);
    }
    .strength-badge {
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
    }
    .strength-badge.strong {
      background: rgba(151, 245, 204, 0.35);
      color: var(--mz-secondary, #006c4e);
    }
    .strength-badge.medium {
      background: var(--mz-warn-soft, #fff4d9);
      color: var(--mz-warn, #b47b20);
    }
    .strength-badge.weak {
      background: #fed7aa;
      color: #ea580c;
    }
    .strength-badge.none {
      background: var(--mz-surface-container, #eaedff);
      color: var(--mz-outline, #6d7a72);
    }
    .source-block-details {
      padding: 14px 18px;
      border-top: 1px solid rgba(188, 202, 192, 0.3);
      background: #fafcfb;
      font-size: 13px;
      line-height: 1.6;
      color: var(--mz-on-surface, #131b2e);
    }
    .source-quote {
      margin: 10px 0;
      padding: 8px 12px;
      background: var(--mz-surface-low, #f2f3ff);
      border-right: 3px solid var(--mz-primary, #006948);
      font-style: italic;
    }
    .source-links-box {
      margin-top: 10px;
    }
    .links-flex {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 6px;
    }
    .source-ext-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--mz-primary, #006948);
      text-decoration: underline;
      font-size: 12px;
      font-weight: 600;
    }
  `]
})
export class PortfolioSimplifierComponent {
  readonly PieChartIcon = PieChart;
  readonly InfoIcon = Info;
  readonly CopyIcon = Copy;
  readonly RotateCcwIcon = RotateCcw;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  readonly ExternalLinkIcon = ExternalLink;

  age: number | null = null;
  selectedProfile: InvestorProfile | null = null;
  includeGold = false;
  totalAmount: number | null = null;

  ageError = false;
  profileError = false;

  result: CalculationResult | null = null;
  expandedMethods: Record<number, boolean> = {};

  sourcesExpanded = false;
  expandedSourceItems: Record<string, boolean> = {};
  highlightedSource: string | null = null;

  @ViewChild('resultsSection') resultsSection?: ElementRef;
  @ViewChild('sourcesSection') sourcesSection?: ElementRef;

  readonly sourcesEntries = Object.entries(PORTFOLIO_SOURCES).map(([key, source]) => ({
    key,
    source
  }));

  constructor(
    private simplifierService: PortfolioSimplifierService,
    private toast: ToastService
  ) {}

  calculate(): void {
    if (this.age === null || isNaN(this.age) || this.age < 18 || this.age > 80) {
      this.ageError = true;
      return;
    }
    this.ageError = false;

    if (!this.selectedProfile) {
      this.profileError = true;
      return;
    }
    this.profileError = false;

    this.result = this.simplifierService.calculate(
      this.age,
      this.selectedProfile,
      this.includeGold,
      this.totalAmount || 0
    );

    setTimeout(() => {
      this.resultsSection?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  reset(): void {
    this.age = null;
    this.selectedProfile = null;
    this.includeGold = false;
    this.totalAmount = null;
    this.ageError = false;
    this.profileError = false;
    this.result = null;
    this.expandedMethods = {};
  }

  toggleDetails(index: number): void {
    this.expandedMethods[index] = !this.expandedMethods[index];
  }

  toggleSourceItem(key: string): void {
    this.expandedSourceItems[key] = !this.expandedSourceItems[key];
  }

  scrollToSource(key: string): void {
    this.sourcesExpanded = true;
    this.expandedSourceItems[key] = true;
    this.highlightedSource = key;

    setTimeout(() => {
      const el = document.getElementById(`source_block_${key}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setTimeout(() => {
      if (this.highlightedSource === key) {
        this.highlightedSource = null;
      }
    }, 2500);
  }

  getRelatedSourceKeys(method: MethodResult): string[] {
    return Array.from(new Set([
      ...(method.sourceTopicKeys || []),
      'core_satellite_ratios',
      'defensive_vs_growth',
      'gold_pct',
      'egx_adaptation'
    ]));
  }

  getSourceShortTitle(key: string): string {
    const src = PORTFOLIO_SOURCES[key];
    if (!src) return key;
    return src.title.split('(')[0].trim();
  }

  formatCurrency(num: number): string {
    return Math.round(num).toLocaleString('ar-EG');
  }

  copyResults(): void {
    if (!this.result) return;
    let text = "نتائج خطة محفظتي الاستثمارية في البورصة المصرية (EGX):\n\n";
    this.result.methods.forEach(method => {
      text += `📌 ${method.name}\n`;
      method.items.forEach(it => {
        const amountStr = it.amount ? ` (${this.formatCurrency(it.amount)} ج.م)` : '';
        text += ` - ${it.rounded}% ${it.label}${amountStr}\n`;
      });
      text += "\n";
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.toast.show('تم نسخ نتائج المحفظة بنجاح!');
      });
    }
  }
}
