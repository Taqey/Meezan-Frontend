import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, PieChart, Info, Copy, RotateCcw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-angular';
import { PortfolioSimplifierService, CalculationResult, MethodResult } from '../../services/portfolio-simplifier.service';
import { InvestorProfile } from './portfolio-config.data';
import { PORTFOLIO_SOURCES, PortfolioSource } from './portfolio-sources.data';
import { PortfolioDonutChartComponent } from './portfolio-donut-chart.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-portfolio-simplifier',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PortfolioDonutChartComponent],
  template: `
    <div class="entity-page portfolio-simplifier-page">
      <!-- Breadcrumbs -->
      <nav class="crumbs" aria-label="مسار التنقل">
        <a routerLink="/">الرئيسية</a>
        <span>‹</span>
        <span class="active">مُبسّط المحفظة</span>
      </nav>

      <!-- Page Hero -->
      <div class="page-hero">
        <span class="eyebrow">أدوات الاستثمار الذكية · EGX Simplifier</span>
        <div class="title-row" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <h1>مُبسط محفظة البورصة المصرية (EGX)</h1>
          <div class="intro-note" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: var(--good-soft); border-radius: 999px; color: var(--primary); font-size: 13px; font-weight: 600;">
            <lucide-icon [img]="PieChartIcon" size="16"></lucide-icon>
            <span>Core-Satellite + Asset Allocation</span>
          </div>
        </div>
        <p>ابنِ محفظتك الاستثمارية الذكية بالجمع بين توزيع الأصول ومنهجية الكور-ساتلايت (Core-Satellite) بطريقة مبسطة ومتوافقة مع السوق المصري.</p>
      </div>

      <!-- Input Form Card -->
      <section class="detail-card form-card">
        <div class="card-heading">
          <div>
            <span class="eyebrow">معطيات المستثمر</span>
            <h2>حدد أهدافك وملفك الاستثماري</h2>
          </div>
        </div>

        <div class="form-grid">
          <!-- Input 1: Age -->
          <div class="form-group">
            <label for="ageInput">1. السن (من 18 إلى 80 سنة):</label>
            <input
              type="number"
              id="ageInput"
              class="form-control"
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
                class="chip-btn"
                [class.active]="selectedProfile === 'Conservative'"
                (click)="selectedProfile = 'Conservative'">
                تحفظي (Conservative)
              </button>
              <button
                type="button"
                class="chip-btn"
                [class.active]="selectedProfile === 'Balanced'"
                (click)="selectedProfile = 'Balanced'">
                متوازن (Balanced)
              </button>
              <button
                type="button"
                class="chip-btn"
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
              class="form-control"
              [(ngModel)]="totalAmount"
              placeholder="مثال: 100000">
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-primary" (click)="calculate()">احسب المحفظة</button>
          <button type="button" class="btn btn-outline" (click)="reset()">
            <lucide-icon [img]="RotateCcwIcon" size="16"></lucide-icon>
            إعادة ضبط
          </button>
        </div>
      </section>

      <!-- Results Section -->
      <section #resultsSection class="results-wrapper" *ngIf="result">
        <!-- Fidelity Notice Banner -->
        <div class="info-banner">
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
          <div class="detail-card method-card" *ngFor="let method of result.methods; let i = index">
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
        <div class="detail-card general-notes-card">
          <div class="card-heading">
            <div>
              <span class="eyebrow">إخلاء مسؤولية وتوجيهات</span>
              <h3>ملاحظات هامة وإخلاء مسؤولية</h3>
            </div>
          </div>
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
            <button type="button" class="btn btn-primary" (click)="copyResults()">
              <lucide-icon [img]="CopyIcon" size="16"></lucide-icon>
              نسخ النتائج
            </button>
          </div>
        </div>
      </section>

      <!-- Collapsible Sources Section -->
      <section #sourcesSection class="detail-card sources-card">
        <div class="sources-toggle-header" (click)="sourcesExpanded = !sourcesExpanded">
          <div class="sources-title-group">
            <span class="eyebrow">المراجع والأدبيات</span>
            <h2>📚 المصادر والتفاصيل (Sources & Details)</h2>
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
      </section>
    </div>
  `,
  styles: [`
    .portfolio-simplifier-page {
      padding-bottom: 80px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 18px;
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
      font-weight: 600;
      font-size: 14px;
      color: var(--ink);
    }
    .form-control {
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      background: var(--card);
      color: var(--ink);
      transition: border-color var(--dur-fast);
    }
    .form-control:focus {
      border-color: var(--primary);
    }
    .profile-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chip-btn {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid var(--border);
      background: var(--card);
      border-radius: 10px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      color: var(--muted-foreground);
      transition: all var(--dur-fast);
      text-align: center;
    }
    .chip-btn.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(8, 127, 91, 0.2);
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
    }
    .switch-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: var(--border);
      transition: .3s;
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
      transition: .3s;
      border-radius: 50%;
    }
    .switch-control input:checked + .switch-slider {
      background-color: var(--good, #10b981);
    }
    .switch-control input:checked + .switch-slider:before {
      transform: translateX(22px);
    }
    .switch-label {
      font-size: 13.5px;
      color: var(--ink);
    }
    .source-link-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 3px 10px;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--primary);
      cursor: pointer;
      transition: background var(--dur-fast);
    }
    .source-link-btn:hover {
      background: var(--border);
    }
    .field-error {
      color: var(--bad, #dc2626);
      font-size: 12px;
      margin-top: 4px;
    }
    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
    }
    .info-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 18px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      color: #1e3a8a;
      font-size: 13px;
      margin-top: 24px;
    }
    .banner-text {
      flex: 1;
    }
    .methods-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
      margin-top: 24px;
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
      border-bottom: 1px solid var(--border);
    }
    .method-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--ink);
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
      margin-top: 3px;
    }
    .legend-pct {
      color: var(--ink);
    }
    .legend-label {
      color: var(--ink);
    }
    .legend-amount {
      color: var(--muted-foreground);
      font-size: 12px;
    }
    .sat-hint-box {
      width: 100%;
      margin-top: 4px;
      margin-right: 20px;
      font-size: 11px;
      color: var(--muted-foreground);
      background: var(--muted);
      padding: 6px 10px;
      border-radius: 6px;
      line-height: 1.4;
    }
    .details-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      margin-top: 16px;
      padding: 8px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--primary);
      cursor: pointer;
    }
    .details-drawer {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px dashed var(--border);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .steps-box h4 {
      font-size: 13px;
      margin-bottom: 6px;
      color: var(--ink);
    }
    .steps-box ol {
      padding-right: 18px;
      margin: 0;
      font-size: 12px;
      color: var(--muted-foreground);
      line-height: 1.6;
    }
    .pros-cons-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      line-height: 1.5;
    }
    .pros {
      color: var(--good);
    }
    .cons {
      color: #b45309;
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
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 11px;
      color: var(--primary);
      cursor: pointer;
    }
    .general-notes-card {
      margin-top: 24px;
    }
    .notes-list {
      padding-right: 20px;
      margin-top: 12px;
      color: var(--muted-foreground);
      font-size: 13px;
      line-height: 1.8;
    }
    .source-inline-btn {
      background: transparent;
      border: none;
      color: var(--primary);
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      text-decoration: underline;
      padding: 0 4px;
    }
    .copy-actions-row {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
    .sources-card {
      margin-top: 24px;
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
    }
    .toggle-icon-btn {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 8px;
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      cursor: pointer;
      color: var(--primary);
    }
    .sources-intro-note {
      font-size: 13px;
      color: var(--muted-foreground);
      margin: 14px 0 18px;
      padding: 10px 14px;
      background: var(--muted);
      border-radius: 8px;
    }
    .source-blocks-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .source-block-item {
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      transition: border-color var(--dur-fast), box-shadow var(--dur-fast);
    }
    .source-block-item.highlight {
      border-color: var(--accent, #087f5b);
      box-shadow: 0 0 0 2px rgba(8, 127, 91, 0.25);
    }
    .source-block-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: var(--card);
      cursor: pointer;
    }
    .source-head-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .source-block-title {
      font-weight: 600;
      font-size: 14px;
      color: var(--ink);
    }
    .strength-badge {
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
    }
    .strength-badge.strong {
      background: var(--good-soft);
      color: var(--good);
    }
    .strength-badge.medium {
      background: var(--warn-soft);
      color: var(--warn);
    }
    .strength-badge.weak {
      background: #fed7aa;
      color: #ea580c;
    }
    .strength-badge.none {
      background: var(--muted);
      color: var(--muted-foreground);
    }
    .source-block-details {
      padding: 14px 18px;
      border-top: 1px solid var(--border);
      background: #fafcfb;
      font-size: 13px;
      line-height: 1.6;
      color: var(--ink);
    }
    .source-quote {
      margin: 10px 0;
      padding: 8px 12px;
      background: var(--muted);
      border-right: 3px solid var(--primary);
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
      color: var(--primary);
      text-decoration: underline;
      font-size: 12px;
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
