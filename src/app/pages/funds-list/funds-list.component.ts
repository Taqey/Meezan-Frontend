import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, Search, ChevronDown, ShieldCheck, TrendingUp, Star, Building2, DollarSign, AlertCircle, SlidersHorizontal, RotateCcw, X } from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { FundListItemDto, FundPagedResultDto, FundListFilter, FundType, FundClassificationTreeNode, FundAssetManagerOption } from '../../models/api.models';
import {
  normFundType,
  normFundRiskLevel,
  fundRiskLabelAr,
  fundLogoUrl,
  FUND_SHARIA_BADGE_TOOLTIP
} from '../../models/fund-display';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ClassificationCascadeComponent } from '../../components/classification-cascade/classification-cascade.component';
import { EntityCardComponent, EntityStat } from '../../components/entity-card/entity-card.component';
import { SectionHeaderComponent } from '../../components/section-header/section-header.component';
import { LoadingSkeletonsComponent } from '../../components/loading-skeletons/loading-skeletons.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, Subscription, timeout, catchError, of } from 'rxjs';
import { KpiStripComponent, KpiData } from '../../components/kpi-strip/kpi-strip.component';
import { ScrollRestorationService } from '../../services/scroll-restoration.service';

@Component({
  selector: 'app-funds-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PageHeaderComponent, ClassificationCascadeComponent, EntityCardComponent, SectionHeaderComponent, LoadingSkeletonsComponent, EmptyStateComponent, KpiStripComponent],
  template: `
    <div class="entity-page">
      <app-page-header
        [crumbs]="headerCrumbs"
        pill="الصناديق الاستثمارية"
        title="الصناديق الاستثمارية المصرية"
        description="استعرض وحلل جميع الصناديق الاستثمارية في السوق المصري مع فلاتر متقدمة للتصنيف، حجم الأصول، مستويات المخاطر، العوائد والرسوم، والرقابة الشرعية.">
      </app-page-header>

      <app-kpi-strip [kpis]="kpiList" [loading]="statsLoading"></app-kpi-strip>

      <app-section-header
        *ngIf="!initialLoading && !loadError"
        [lead]="totalCount + ' صندوقاً استثمارياً في قاعدة البيانات'"
        [sourceNote]="sourceNote">
      </app-section-header>

      <div class="funds-filters-container" *ngIf="!initialLoading || hasInitialized">
        <!-- Filter Card Header with Title, Subtitle, and Quick Actions -->
        <div class="filter-card-header">
          <div class="filter-header-title-wrap">
            <div class="filter-header-icon-box">
              <lucide-icon [img]="SlidersIcon" size="18"></lucide-icon>
            </div>
            <div>
              <h2 class="filter-main-title">فلترة وتخصيص الصناديق</h2>
              <p class="filter-sub-title">حدد المعايير لعرض الصناديق المتوافقة مع أهدافك المالية</p>
            </div>
          </div>
          <div class="filter-header-actions">
            <button
              type="button"
              class="btn-reset-filters"
              *ngIf="hasActiveFilters"
              (click)="resetFilters()"
              aria-label="مسح الفلاتر">
              <lucide-icon [img]="RotateIcon" size="13"></lucide-icon>
              <span>مسح الفلاتر</span>
            </button>
            <button
              type="button"
              class="btn btn-outline btn-advanced-toggle"
              [class.active]="advancedOpen"
              (click)="toggleAdvanced()"
              aria-expanded="advancedOpen">
              <lucide-icon [img]="SlidersIcon" size="15"></lucide-icon>
              <span>فلاتر متقدمة</span>
              <span *ngIf="activeFiltersCount > 0" class="badge-count">{{ activeFiltersCount }}</span>
              <lucide-icon [img]="ChevronDownIcon" size="14" class="toggle-arrow" [class.rotated]="advancedOpen"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- 1. Toolbar Row: Search + Quick Chips + Sort Dropdown -->
        <div class="filters-toolbar">
          <div class="search-wrap">
            <lucide-icon [img]="SearchIcon" size="16"></lucide-icon>
            <input
              id="fund-search"
              [(ngModel)]="searchText"
              (ngModelChange)="searchChanged.next($event)"
              placeholder="ابحث بالاسم أو الرمز (مثال: PHF)..."
              aria-label="البحث عن صندوق" />
            <button *ngIf="searchText" type="button" class="btn-clear-search" (click)="removeSearchFilter()" aria-label="مسح البحث">
              <lucide-icon [img]="XIcon" size="14"></lucide-icon>
            </button>
          </div>

          <div class="toolbar-chips" role="group" aria-label="فرز سريع">
            <button
              *ngFor="let c of quickChips"
              type="button"
              class="chip"
              [class.active]="c.id === activeChip"
              [attr.aria-pressed]="c.id === activeChip"
              (click)="setChip(c.id)">
              {{ c.label }}
            </button>
          </div>

          <div class="toolbar-sort">
            <label class="toolbar-label" for="fund-sort">الترتيب:</label>
            <div class="sort-select-wrap">
              <select id="fund-sort" [(ngModel)]="filter.sortBy" (ngModelChange)="onSortChange()" aria-label="حقل الترتيب">
                <option value="return1y">العائد السنوي (1Y)</option>
                <option value="return6m">العائد (6M)</option>
                <option value="return3m">العائد (3M)</option>
                <option value="return1m">العائد (1M)</option>
                <option value="aum">الأصول (AUM)</option>
                <option value="totalScore">الدرجة الكلية</option>
                <option value="managementFee">الرسوم السنوية</option>
                <option value="name">الاسم أبجدياً</option>
              </select>
              <select [(ngModel)]="filter.sortDir" (ngModelChange)="onSortChange()" aria-label="اتجاه الترتيب" class="sort-dir-select">
                <option value="desc">تنازلي</option>
                <option value="asc">تصاعدي</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 2. Stale Node Fallback Notice (Graceful degraded handling) -->
        <div *ngIf="staleNodeNotice" class="stale-notice">
          <span>{{ staleNodeNotice }}</span>
          <button type="button" (click)="staleNodeNotice = null" aria-label="إغلاق التنبيه">
            <lucide-icon [img]="XIcon" size="13"></lucide-icon>
          </button>
        </div>

        <!-- 3. Collapsible Advanced Filters Panel (CSS animated) -->
        <div class="advanced-panel-wrapper" [class.open]="advancedOpen">
          <div class="advanced-panel-inner">
            <div class="advanced-grid">
              <!-- Dynamic Classification Tree Cascades -->
              <div class="cascade-grid-item">
                <app-classification-cascade
                  [tree]="classTree"
                  [path]="classPath"
                  rootLabel="نوع الصندوق"
                  allLabel="كل الأنواع"
                  (pathChange)="onClassPathChange($event)">
                </app-classification-cascade>
              </div>

              <!-- Asset Manager Filter (الشركة المسؤولة عن الصندوق) -->
              <div class="filter-field">
                <label class="filter-label" for="fund-manager">الشركة المسؤولة (مدير الأصول)</label>
                <select
                  id="fund-manager"
                  [ngModel]="filter.assetManagerId"
                  (ngModelChange)="onManagerChange($event)"
                  aria-label="الشركة المسؤولة عن الصندوق">
                  <option [ngValue]="undefined">كل الشركات والمديرين</option>
                  <option *ngFor="let mgr of assetManagers" [ngValue]="mgr.id">
                    {{ mgr.nameAr }} ({{ mgr.fundCount }})
                  </option>
                </select>
              </div>

              <!-- Risk Level Filter -->
              <div class="filter-field">
                <label class="filter-label" for="fund-risk">مستوى المخاطر</label>
                <select id="fund-risk" [ngModel]="filter.riskLevel" (ngModelChange)="onRiskChange($event)" aria-label="مستوى المخاطر">
                  <option [ngValue]="undefined">كل المستويات</option>
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              </div>

              <!-- Sharia Ruling Filter (المصدر) -->
              <div class="filter-field">
                <label class="filter-label" for="fund-sharia">الحكم الشرعي (المصدر)</label>
                <select id="fund-sharia" [ngModel]="filter.isIslamic" (ngModelChange)="onShariaChange($event)" aria-label="الحكم الشرعي">
                  <option [ngValue]="undefined">الكل</option>
                  <option [ngValue]="true">متوافق شرعياً</option>
                  <option [ngValue]="false">غير متوافق</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Active Filters Bar with Removable Chips & Clear Button -->
        <div class="active-filters-bar" *ngIf="hasActiveFilters">
          <div class="active-chips-list">
            <span class="active-chips-label">الفلاتر النشطة:</span>
            <span class="active-chip" *ngIf="filter.search">
              <span>البحث: {{ filter.search }}</span>
              <button type="button" (click)="removeSearchFilter()" aria-label="حذف بحث">
                <lucide-icon [img]="XIcon" size="13"></lucide-icon>
              </button>
            </span>

            <span class="active-chip" *ngIf="activeNodeName">
              <span>التصنيف: {{ activeNodeName }}</span>
              <button type="button" (click)="removeNodeFilter()" aria-label="حذف فلتر التصنيف">
                <lucide-icon [img]="XIcon" size="13"></lucide-icon>
              </button>
            </span>

            <span class="active-chip" *ngIf="activeManagerName">
              <span>المدير: {{ activeManagerName }}</span>
              <button type="button" (click)="removeManagerFilter()" aria-label="حذف فلتر المدير">
                <lucide-icon [img]="XIcon" size="13"></lucide-icon>
              </button>
            </span>

            <span class="active-chip" *ngIf="filter.riskLevel">
              <span>المخاطر: {{ filter.riskLevel === 'low' ? 'منخفضة' : filter.riskLevel === 'medium' ? 'متوسطة' : 'عالية' }}</span>
              <button type="button" (click)="removeRiskFilter()" aria-label="حذف فلتر المخاطر">
                <lucide-icon [img]="XIcon" size="13"></lucide-icon>
              </button>
            </span>

            <span class="active-chip" *ngIf="filter.isIslamic !== undefined">
              <span>الحكم: {{ filter.isIslamic ? 'متوافق شرعياً' : 'غير متوافق' }}</span>
              <button type="button" (click)="removeShariaFilter()" aria-label="حذف فلتر التوافق الشرعي">
                <lucide-icon [img]="XIcon" size="13"></lucide-icon>
              </button>
            </span>
          </div>

          <button type="button" class="btn btn-outline btn-sm btn-clear-filters" (click)="resetFilters()">
            <lucide-icon [img]="RotateIcon" size="14"></lucide-icon>
            <span>مسح الفلاتر</span>
          </button>
        </div>
      </div>

      <!-- Results summary header -->
      <div id="results-head" class="results-head" *ngIf="!initialLoading && !loadError">
        <span>عرض <strong class="results-count">{{ totalCount }}</strong> نتيجة مطابقة (الصفحة {{ currentPage }} من {{ totalPages || 1 }})</span>
      </div>

      <!-- Error State -->
      <app-empty-state
        *ngIf="loadError"
        title="تعذّر تحميل الصناديق"
        message="تحقق من الاتصال ثم حاول مرة أخرى."
        actionLabel="إعادة المحاولة"
        (action)="loadFunds()">
      </app-empty-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!initialLoading && !loading && !loadError && funds.length === 0"
        title="لا توجد صناديق مطابقة للفلاتر المختارة"
        message="جرّب تعديل خيارات البحث أو إزالة أحد الفلاتر لتوسيع نطاق النتائج.">
      </app-empty-state>

      <!-- Results Grid Container: Initial skeletons or cards grid with filtering state -->
      <div class="results-area" [class.is-filtering]="loading">
        <app-loading-skeletons *ngIf="initialLoading && !loadError && funds.length === 0" variant="card" [count]="6"></app-loading-skeletons>

        <div class="entity-grid" *ngIf="funds.length && !loadError">
          <app-entity-card
            *ngFor="let fund of funds; let i = index; trackBy: trackFund"
            [itemIndex]="i"
            [title]="fund.nameAr"
            [subtitle]="fund.nameEn"
            [icon]="getFundIcon(normFundType(fund.type))"
            [accent]="getFundAccent(normFundType(fund.type)).accent"
            [tint]="getFundAccent(normFundType(fund.type)).tint"
            [ink]="getFundAccent(normFundType(fund.type)).ink"
            [pill]="getClassificationBadge(fund)"
            [stats]="cardStats(fund)"
            [link]="['/funds', fund.slug]"
            [ribbon]="fund.isIslamic ? 'متوافق شرعياً' : null"
            [ribbonTitle]="fund.isIslamic ? shariaBadgeTooltip : null"
            [featured]="fund.isFeatured"
            [logoUrl]="fundLogoUrl(fund.localLogoPath, fund.logoUrl)">
          </app-entity-card>
        </div>
      </div>


      <div *ngIf="!initialLoading && !loadError && totalPages > 1" class="pagination" style="display: flex; justify-content: center; gap: 8px; margin-top: 24px; padding: 0 24px 24px;">
        <button class="btn btn-outline" (click)="goToPage(currentPage - 1)" [disabled]="currentPage <= 1">
          <lucide-icon [img]="ChevronDownIcon" size="16"></lucide-icon> السابق
        </button>
        <span style="display: flex; align-items: center; padding: 0 16px; color: var(--muted-foreground);">
          صفحة {{ currentPage }} من {{ totalPages }}
        </span>
        <button class="btn btn-outline" (click)="goToPage(currentPage + 1)" [disabled]="currentPage >= totalPages">
          التالي <lucide-icon [img]="ChevronDownIcon" size="16"></lucide-icon>
        </button>
      </div>

      <div class="attribution" style="margin: 24px; padding: 16px; background: var(--muted); border-radius: 12px; text-align: center; font-size: 12px; color: var(--muted-foreground);">
        المصدر: <a href="https://snduk.com" target="_blank" rel="noopener" style="color: var(--primary); text-decoration: underline;">SNDUK</a> |
        آخر تحديث: {{ lastSyncedAt ? (lastSyncedAt | date:'yyyy-MM-dd HH:mm') : '—' }} |
        <span style="color: var(--bad);">إخلاء المسؤولية: البيانات للأغراض المعلوماتية فقط ولا تُعد نصيحة استثمارية.</span>
      </div>
    </div>


  `,
  styles: [`
    .funds-filters-container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      margin: 0 24px 20px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 1px 4px rgba(23, 35, 31, .04);
    }

    /* Filter Card Header matching visual reference */
    .filter-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }

    .filter-header-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .filter-header-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--good-soft);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .filter-main-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--foreground);
      margin: 0;
      line-height: 1.3;
    }

    .filter-sub-title {
      font-size: 12px;
      color: var(--muted-foreground);
      margin: 2px 0 0;
      line-height: 1.4;
    }

    .filter-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-inline-start: auto;
    }

    .btn-reset-filters {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted-foreground);
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-reset-filters:hover {
      color: var(--bad);
      border-color: var(--bad);
      background: #fef2f2;
    }

    .filters-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filters-toolbar .search-wrap {
      flex: 1 1 240px;
      min-width: 200px;
      height: 40px;
      margin: 0;
      position: relative;
    }

    .btn-clear-search {
      background: none;
      border: none;
      color: var(--muted-foreground);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
    }
    .btn-clear-search:hover {
      color: var(--foreground);
    }

    .toolbar-chips {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .toolbar-sort {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .toolbar-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--muted-foreground);
      white-space: nowrap;
    }

    .sort-select-wrap {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .sort-select-wrap select {
      height: 38px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--card);
      padding: 0 8px;
      font-size: 12.5px;
      color: var(--foreground);
      outline-color: var(--primary);
    }

    .sort-dir-select {
      width: 78px;
    }

    .btn-advanced-toggle {
      height: 36px;
      gap: 6px;
      border-radius: 8px;
      font-size: 12.5px;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .btn-advanced-toggle.active {
      background: var(--good-soft);
      border-color: var(--primary);
      color: var(--primary);
    }

    .toggle-arrow {
      transition: transform 0.25s ease;
    }
    .toggle-arrow.rotated {
      transform: rotate(180deg);
    }

    .badge-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      border-radius: 999px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
    }

    /* Stale notice fallback alert */
    .stale-notice {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: #fef3c7;
      border: 1px solid #fde68a;
      color: #92400e;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 12.5px;
    }
    .stale-notice button {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
    }

    /* Collapsible panel with grid transition */
    .advanced-panel-wrapper {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .advanced-panel-wrapper.open {
      grid-template-rows: 1fr;
    }

    .advanced-panel-inner {
      overflow: hidden;
    }

    .advanced-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }

    .filter-field {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filter-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--foreground);
      display: block;
      margin-bottom: 2px;
    }

    .filter-field select,
    .cascade-grid-item select {
      width: 100%;
      height: 38px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--card);
      padding: 0 10px;
      font-size: 12px;
      color: var(--foreground);
      outline-color: var(--primary);
    }

    /* Active filters strip */
    .active-filters-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }

    .active-chips-label {
      font-size: 12px;
      color: var(--muted-foreground);
      font-weight: 600;
    }

    .active-chips-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .active-chip {
      color: var(--primary);
      background: var(--good-soft);
      border: 1px solid rgba(8, 127, 91, 0.2);
      border-radius: 999px;
      padding: 4px 10px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      transition: background 0.15s ease, transform 0.15s ease;
    }
    .active-chip:hover {
      background: #d1fae5;
    }
    .active-chip button {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border-radius: 50%;
    }
    .active-chip button:hover {
      background: rgba(0, 0, 0, 0.08);
    }

    .btn-clear-filters {
      gap: 5px;
      height: 32px;
      border-radius: 8px;
      font-size: 12px;
      color: var(--muted-foreground);
      transition: all 0.2s ease;
    }
    .btn-clear-filters:hover {
      color: var(--bad);
      border-color: var(--bad);
      background: #fef2f2;
    }

    /* Results Header */
    .results-head {
      margin: 0 24px 14px;
      font-size: 13px;
      font-weight: 500;
      color: var(--muted-foreground);
    }
    .results-head .results-count {
      color: var(--foreground);
      font-weight: 800;
    }

    /* Results Area & Reduced-Opacity Loading state */
    .results-area {
      position: relative;
      min-height: 400px;
      transition: opacity 0.2s ease;
    }
    .results-area.is-filtering {
      opacity: 0.55;
      pointer-events: none;
    }

    /* Card Grid Responsive rules: auto-fill with 280px minimum keeps all metrics unclipped and cards equal height */
    :host ::ng-deep .entity-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
      align-items: stretch !important;
      gap: 16px !important;
      margin: 0 24px !important;
    }

    @media (max-width: 768px) {
      .funds-filters-container {
        margin: 0 16px 16px;
        padding: 14px;
      }
      .filter-card-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .filter-header-actions {
        width: 100%;
        justify-content: space-between;
        margin-inline-start: 0;
      }
      .toolbar-sort {
        width: 100%;
        justify-content: space-between;
      }
      .sort-select-wrap {
        flex: 1;
        justify-content: flex-end;
      }
      .sort-select-wrap select {
        flex: 1;
      }
      .results-head {
        margin: 0 16px 12px;
      }
      :host ::ng-deep .entity-grid {
        margin: 0 16px !important;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .advanced-panel-wrapper,
      .toggle-arrow,
      .active-chip,
      .btn-advanced-toggle,
      .results-area {
        transition: none !important;
      }
    }
  `]
})
export class FundsListComponent implements OnInit, OnDestroy {
  readonly SearchIcon = Search;
  readonly AlertCircleIcon = AlertCircle;
  readonly ChevronDownIcon = ChevronDown;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly TrendingUpIcon = TrendingUp;
  readonly StarIcon = Star;
  readonly Building2Icon = Building2;
  readonly DollarSignIcon = DollarSign;
  readonly SlidersIcon = SlidersHorizontal;
  readonly RotateIcon = RotateCcw;
  readonly XIcon = X;

  readonly shariaBadgeTooltip = FUND_SHARIA_BADGE_TOOLTIP;
  readonly normFundType = normFundType;
  readonly fundLogoUrl = fundLogoUrl;

  headerCrumbs = [{ label: 'الرئيسية', link: ['/'] }];

  funds: FundListItemDto[] = [];
  /** Public classification tree driving the cascading filters. */
  classTree: FundClassificationTreeNode[] = [];
  /** Selected classification path, root-first slugs (e.g. ['equity','sector','sector-financial']). */
  classPath: string[] = [];
  /** Distinct asset managers with fund counts from the API. */
  assetManagers: FundAssetManagerOption[] = [];
  /** Toggle state for advanced filters collapsible panel. */
  advancedOpen = false;
  /** Stale / unknown node notification text if URL provided an unknown node slug. */
  staleNodeNotice: string | null = null;

  loading = true;
  initialLoading = true;
  hasInitialized = false;
  loadError = false;
  statsLoading = true;

  filter: FundListFilter = {
    sortBy: 'return1y',
    sortDir: 'desc',
    page: 1,
    pageSize: 20
  };

  /** Bound to the search input; debounced into filter.search via searchChanged. */
  searchText = '';
  readonly searchChanged = new Subject<string>();
  private readonly fundsQuery$ = new Subject<FundListFilter>();
  private querySub?: Subscription;

  currentPage = 1;
  totalPages = 0;
  totalCount = 0;

  activeChip = 'all';

  /** Quick chips defined in one config array for 100% dynamic configuration */
  readonly quickChips: Array<{ id: string; label: string; param?: string; value?: string }> = [
    { id: 'all', label: 'الكل' },
    { id: 'islamic', label: 'متوافق شرعياً', param: 'sharia', value: 'compliant' },
    { id: 'featured', label: 'مميز', param: 'featured', value: 'true' },
    { id: 'top_return', label: 'أعلى عائد', param: 'sortBy', value: 'return1y' }
  ];

  kpiList: KpiData[] = [];

  lastSyncedAt: string | null = null;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private scrollRestoration: ScrollRestorationService
  ) {}

  ngOnInit(): void {
    // Pipeline with switchMap so only the latest request response is applied
    this.querySub = this.fundsQuery$.pipe(
      switchMap((filter) => {
        this.loading = true;
        this.loadError = false;
        return this.api.getFunds(filter).pipe(
          timeout(15000),
          catchError((err) => {
            this.loading = false;
            this.initialLoading = false;
            this.loadError = true;
            return of(null);
          })
        );
      })
    ).subscribe({
      next: (res: FundPagedResultDto | null) => {
        if (!res) return;
        this.funds = res.items;
        this.totalCount = res.totalCount;
        this.totalPages = res.totalPages;
        this.currentPage = res.page;
        this.loading = false;
        this.initialLoading = false;
        this.hasInitialized = true;
        this.loadError = false;
        this.updateLastSyncedAt();
      },
      error: () => {
        this.loading = false;
        this.initialLoading = false;
        this.loadError = true;
      }
    });

    this.searchChanged.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.filter.search = query?.trim() || undefined;
      this.filter.page = 1;
      this.currentPage = 1;
      this.loadFunds();
    });

    // Deep-link support: URL is the single source of truth.
    // Handles node=<slug>, manager=<id>, sharia=<compliant|all>, sort, dir, search, and legacy params.
    this.route.queryParamMap.subscribe(params => {
      const nodeSlug = params.get('node');
      const leafSlug = params.get('leaf');
      const subTypeSlug = params.get('subType');
      const typeSlug = params.get('type');
      const rawPath = params.get('path');
      const managerParam = params.get('manager');
      const shariaParam = params.get('sharia');
      const riskParam = params.get('risk');
      const sortParam = params.get('sortBy');
      const dirParam = params.get('sortDir');
      const searchParam = params.get('search');
      const featuredParam = params.get('featured');

      if (searchParam) {
        this.searchText = searchParam;
        this.filter.search = searchParam;
      } else if (!this.searchText) {
        this.filter.search = undefined;
      }

      if (managerParam) {
        const mgrId = Number(managerParam);
        this.filter.assetManagerId = !isNaN(mgrId) && mgrId > 0 ? mgrId : undefined;
      } else {
        this.filter.assetManagerId = undefined;
      }

      if (shariaParam === 'compliant' || shariaParam === 'true') {
        this.filter.isIslamic = true;
      } else if (shariaParam === 'non-compliant' || shariaParam === 'false') {
        this.filter.isIslamic = false;
      } else {
        this.filter.isIslamic = undefined;
      }

      if (riskParam === 'low' || riskParam === 'medium' || riskParam === 'high') {
        this.filter.riskLevel = riskParam as 'low' | 'medium' | 'high';
      } else {
        this.filter.riskLevel = undefined;
      }

      if (featuredParam === 'true') {
        this.filter.isFeatured = true;
      } else {
        this.filter.isFeatured = undefined;
      }

      if (sortParam) {
        this.filter.sortBy = sortParam as never;
      }
      if (dirParam === 'asc' || dirParam === 'desc') {
        this.filter.sortDir = dirParam;
      }

      // Sync active quick chip
      if (this.filter.isIslamic === true) {
        this.activeChip = 'islamic';
      } else if (this.filter.isFeatured === true) {
        this.activeChip = 'featured';
      } else if (this.filter.sortBy === 'return1y' && (!this.filter.sortDir || this.filter.sortDir === 'desc') && !this.filter.isIslamic && !this.filter.isFeatured) {
        this.activeChip = 'top_return';
      } else {
        this.activeChip = 'all';
      }

      const targetSlug = (nodeSlug || leafSlug || subTypeSlug || typeSlug)?.trim().toLowerCase() || null;
      if (targetSlug) {
        this.pendingLegacySlug = targetSlug;
        if (this.classTree.length) {
          const full = this.pathForSlug(this.pendingLegacySlug);
          if (full.length) {
            this.classPath = full;
            this.staleNodeNotice = null;
          } else {
            this.classPath = [];
            this.staleNodeNotice = `التصنيف "${targetSlug}" لم يعد متاحاً وتم الرجوع للكل`;
          }
          this.pendingLegacySlug = null;
        } else {
          this.classPath = [targetSlug];
        }
        this.filter.node = this.classPath.length ? this.classPath[this.classPath.length - 1] : undefined;
        this.filter.type = undefined;
      } else if (rawPath) {
        this.classPath = rawPath.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        this.applyClassPathToFilter();
      } else {
        this.classPath = [];
        this.staleNodeNotice = null;
        this.applyClassPathToFilter();
      }

      this.loadFunds();
    });

    this.loadFundStats();
    this.loadClassTree();
    this.loadAssetManagers();
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }

  get sourceNote(): string | null {
    return 'المصدر: SNDUK';
  }

  /** Single legacy slug from ?node= / ?type= links, resolved to a full path once the tree loads. */
  private pendingLegacySlug: string | null = null;

  loadClassTree(): void {
    this.api.getClassificationTree().subscribe({
      next: (tree) => {
        this.classTree = tree || [];
        if (this.pendingLegacySlug) {
          const full = this.pathForSlug(this.pendingLegacySlug);
          if (full.length) {
            this.classPath = full;
            this.staleNodeNotice = null;
            this.applyClassPathToFilter();
            this.advancedOpen = true;
          } else {
            this.classPath = [];
            this.staleNodeNotice = `التصنيف "${this.pendingLegacySlug}" لم يعد متاحاً وتم الرجوع للكل`;
            this.updateUrlParams({ node: null });
          }
          this.pendingLegacySlug = null;
        } else if (this.classPath.length) {
          const deepest = this.classPath[this.classPath.length - 1];
          const full = this.pathForSlug(deepest);
          if (full.length) {
            this.classPath = full;
            this.advancedOpen = true;
          }
        }
      },
      error: () => {}
    });
  }

  loadAssetManagers(): void {
    this.api.getFundAssetManagers().subscribe({
      next: (managers) => {
        this.assetManagers = (managers || []).filter(m => m.fundCount > 0);
      },
      error: () => {}
    });
  }

  /** Full root-first path for any known slug (used for legacy single-slug links). */
  pathForSlug(slug: string): string[] {
    const s = (slug || '').trim().toLowerCase();
    if (!s) return [];
    // Legacy alias handled server-side too, but resolve locally for the cascade UI.
    const target = s === 'commodities' ? 'silver' : s;
    const bySlug = new Map(this.classTree.map(n => [n.slug.toLowerCase(), n]));
    const node = bySlug.get(target);
    if (!node) {
      return [];
    }
    const path: string[] = [node.slug];
    let cur: FundClassificationTreeNode | undefined = node;
    let guard = 0;
    while (cur?.parentSlug && guard++ < 8) {
      const parent = bySlug.get(cur.parentSlug.toLowerCase());
      if (!parent) break;
      path.unshift(parent.slug);
      cur = parent;
    }
    return path;
  }

  /** Deepest selected slug drives the API `node` filter (includes descendants server-side). */
  private applyClassPathToFilter(): void {
    const deepest = this.classPath.length ? this.classPath[this.classPath.length - 1] : undefined;
    this.filter.node = deepest;
    this.filter.type = undefined;
  }

  onClassPathChange(path: string[]): void {
    this.classPath = path;
    this.staleNodeNotice = null;
    this.applyClassPathToFilter();
    this.filter.page = 1;
    this.currentPage = 1;
    const deepest = this.classPath.length ? this.classPath[this.classPath.length - 1] : null;
    this.updateUrlParams({ node: deepest, path: null, type: null, subType: null, leaf: null });
  }

  onManagerChange(managerId: number | undefined): void {
    this.filter.assetManagerId = managerId ? Number(managerId) : undefined;
    this.filter.page = 1;
    this.currentPage = 1;
    this.updateUrlParams({ manager: this.filter.assetManagerId || null });
  }

  onShariaChange(val: boolean | undefined): void {
    this.filter.isIslamic = val;
    this.filter.page = 1;
    this.currentPage = 1;
    const shariaVal = val === true ? 'compliant' : val === false ? 'non-compliant' : null;
    this.updateUrlParams({ sharia: shariaVal });
  }

  onSortChange(): void {
    this.filter.page = 1;
    this.currentPage = 1;
    this.updateUrlParams({ sortBy: this.filter.sortBy, sortDir: this.filter.sortDir });
  }

  onRiskChange(val: string | undefined): void {
    this.filter.riskLevel = (val as 'low' | 'medium' | 'high') || undefined;
    this.filter.page = 1;
    this.currentPage = 1;
    this.updateUrlParams({ risk: this.filter.riskLevel || null });
  }

  updateUrlParams(params: Record<string, string | number | null | undefined>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }

  toggleAdvanced(): void {
    this.advancedOpen = !this.advancedOpen;
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.classPath.length > 0) count++;
    if (this.filter.assetManagerId) count++;
    if (this.filter.riskLevel) count++;
    if (this.filter.isIslamic !== undefined) count++;
    return count;
  }

  get activeNodeName(): string | null {
    if (!this.classPath.length || !this.classTree.length) return null;
    const deepestSlug = this.classPath[this.classPath.length - 1];
    const node = this.classTree.find(n => n.slug.toLowerCase() === deepestSlug.toLowerCase());
    return node ? node.nameAr : deepestSlug;
  }

  get activeManagerName(): string | null {
    if (!this.filter.assetManagerId || !this.assetManagers.length) return null;
    const mgr = this.assetManagers.find(m => m.id === this.filter.assetManagerId);
    return mgr ? mgr.nameAr : null;
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.searchText ||
      this.classPath.length > 0 ||
      this.filter.assetManagerId ||
      this.filter.riskLevel ||
      this.filter.isIslamic !== undefined ||
      this.filter.isFeatured
    );
  }

  removeSearchFilter(): void {
    this.searchText = '';
    this.filter.search = undefined;
    this.updateUrlParams({ search: null });
    this.loadFunds();
  }

  removeNodeFilter(): void {
    this.classPath = [];
    this.staleNodeNotice = null;
    this.filter.node = undefined;
    this.updateUrlParams({ node: null });
  }

  removeManagerFilter(): void {
    this.filter.assetManagerId = undefined;
    this.updateUrlParams({ manager: null });
  }

  removeRiskFilter(): void {
    this.filter.riskLevel = undefined;
    this.updateUrlParams({ risk: null });
  }

  removeShariaFilter(): void {
    this.filter.isIslamic = undefined;
    this.updateUrlParams({ sharia: null });
  }

  loadFunds(): void {
    this.filter.page = this.currentPage;
    this.fundsQuery$.next({ ...this.filter });
  }

  loadFundStats(): void {
    this.statsLoading = true;
    this.api.getFundStats().subscribe({
      next: (stats) => {
        this.kpiList = [
          { icon: this.Building2Icon, value: String(stats.totalCount), label: 'صندوقاً استثمارياً' },
          {
            icon: this.TrendingUpIcon,
            value: stats.bestDailyChange != null
              ? `${stats.bestDailyChange > 0 ? '+' : ''}${stats.bestDailyChange.toFixed(2)}%`
              : '—',
            sub: stats.bestDailyChangeCode ?? null,
            label: 'أفضل أداء اليوم'
          },
          { icon: this.ShieldCheckIcon, value: String(stats.islamicCount), label: 'متوافق شرعياً (SNDUK)' },
          { icon: this.DollarSignIcon, value: this.formatAum(stats.totalAum), label: 'إجمالي الأصول تحت الإدارة' }
        ];
        this.statsLoading = false;
      },
      error: () => { this.statsLoading = false; }
    });
  }

  private formatAum(value: number): string {
    if (!value) return '—';
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)} مليار`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)} م`;
    return String(Math.round(value));
  }

  updateLastSyncedAt(): void {
    const latest = this.funds.reduce((max, f) => f.lastSyncedAt && f.lastSyncedAt > max ? f.lastSyncedAt : max, '');
    this.lastSyncedAt = latest || null;
  }

  setChip(id: string): void {
    this.activeChip = id;
    this.filter.page = 1;
    this.currentPage = 1;
    const chip = this.quickChips.find(c => c.id === id);
    if (!chip || id === 'all') {
      this.filter.isIslamic = undefined;
      this.filter.isFeatured = undefined;
      this.updateUrlParams({ sharia: null, featured: null });
    } else if (id === 'islamic') {
      this.filter.isIslamic = true;
      this.filter.isFeatured = undefined;
      this.updateUrlParams({ sharia: 'compliant', featured: null });
    } else if (id === 'featured') {
      this.filter.isIslamic = undefined;
      this.filter.isFeatured = true;
      this.updateUrlParams({ sharia: null, featured: 'true' });
    } else if (id === 'top_return') {
      this.filter.sortBy = 'return1y';
      this.filter.sortDir = 'desc';
      this.filter.isIslamic = undefined;
      this.filter.isFeatured = undefined;
      this.updateUrlParams({ sortBy: 'return1y', sortDir: 'desc', sharia: null, featured: null });
    }
    this.loadFunds();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadFunds();
    this.scrollRestoration.scrollToGrid('#results-head');
  }

  resetFilters(): void {
    this.filter = { sortBy: 'return1y', sortDir: 'desc', page: 1, pageSize: 20 };
    this.classPath = [];
    this.searchText = '';
    this.activeChip = 'all';
    this.staleNodeNotice = null;
    this.currentPage = 1;
    this.updateUrlParams({
      node: null,
      path: null,
      type: null,
      subType: null,
      leaf: null,
      manager: null,
      sharia: null,
      risk: null,
      featured: null,
      search: null,
      sortBy: null,
      sortDir: null
    });
    this.loadFunds();
  }

  trackFund(_: number, fund: FundListItemDto): string { return fund.code; }

  cardStats(fund: FundListItemDto): EntityStat[] {
    const stats: EntityStat[] = [
      fund.currentPrice != null
        ? { label: 'السعر', value: fund.currentPrice + ' ' + (fund.currency || 'EGP') }
        : { label: 'السعر', value: null },
      fund.dailyChange != null
        ? { label: 'التغيير اليومي', value: (fund.dailyChange > 0 ? '+' : '') + fund.dailyChange + '%', tone: fund.dailyChange > 0 ? 'positive' : fund.dailyChange < 0 ? 'negative' : 'muted' }
        : { label: 'التغيير اليومي', value: null },
      fund.return1M != null
        ? { label: 'العائد 1M', value: (fund.return1M > 0 ? '+' : '') + fund.return1M.toFixed(2) + '%', tone: fund.return1M > 0 ? 'positive' : fund.return1M < 0 ? 'negative' : 'muted' }
        : { label: 'العائد 1M', value: null },
      fund.aum != null
        ? { label: 'الأصول (AUM)', value: (fund.aum / 1e6).toFixed(1) + ' م ' + (fund.currency || 'EGP') }
        : { label: 'الأصول (AUM)', value: null },
      fund.managementFee != null
        ? { label: 'الرسوم السنوية', value: fund.managementFee + '%' }
        : { label: 'الرسوم السنوية', value: null }
    ];
    const riskLabel = fundRiskLabelAr(normFundRiskLevel(fund.riskLevel));
    if (riskLabel !== null) {
      stats.push({ label: 'المخاطر', value: riskLabel });
    }
    return stats;
  }

  getClassificationBadge(fund: FundListItemDto): string {
    if (fund.effectiveClassification?.leafNameAr) {
      return fund.effectiveClassification.leafNameAr;
    }
    if (fund.effectiveClassification?.nameAr) {
      return fund.effectiveClassification.nameAr;
    }
    if (fund.effectiveClassification?.rootNameAr) {
      return fund.effectiveClassification.rootNameAr;
    }
    if (fund.classificationPathAr) {
      const parts = fund.classificationPathAr.split(' › ');
      if (parts.length > 0 && parts[parts.length - 1].trim()) return parts[parts.length - 1].trim();
    }
    return fund.typeNameAr || 'غير مصنف';
  }



  getFundIcon(type: FundType): any {
    switch (type) {
      case 'equity': return this.Building2Icon;
      case 'fixed_income': return this.DollarSignIcon;
      case 'money_market': return this.ShieldCheckIcon;
      case 'balanced': return this.TrendingUpIcon;
      case 'index': return this.StarIcon;
      case 'gold': return this.DollarSignIcon;
      default: return this.Building2Icon;
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
}
