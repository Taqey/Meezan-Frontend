import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  LucideAngularModule,
  Upload,
  RefreshCw,
  Database,
  History,
  CheckCircle,
  AlertTriangle,
  Play,
  Search,
  Save,
  RotateCcw,
  LogOut,
  Calendar,
  Clock,
  Edit3,
  FileText,
  Upload as UploadIcon,
  X,
  AlertCircle,
  Check,
  ShieldCheck
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { AdminAuthService } from '../../services/admin-auth.service';
import {
  IndexSummaryDto,
  MarketDataDto,
  ManualMarketDataUpdateRequest,
  ManualMarketDataUpdateResponse,
  AdminStockLookupItem,
  RefreshShariahDataResult,
  RunCombinedScrapeResult,
  ScrapeStatusResponse,
  SeedShariahResultDto,
  SourcePdfStatusDto,
  StockListItemDto,
  UploadIndexFileResultDto,
  RemovalCandidateDto,
  RefreshSelectedStocksResult,
  StockManagementItem,
  SectorPickerItem,
  IndexPickerItem,
  ShariahOverridesDto,
  SaveShariahOverridesRequest
} from '../../models/api.models';
import {
  SHARIAH_STANDARDS,
  scholarsDebtMax,
  SCHOLARS_STANDARD_NAME_AR,
  SCHOLARS_STANDARD_NAME_EN
} from '../../models/shariah-standards';

interface EditableMarketForm {
  closingPrice: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  nominalValue: number | null;
  bookValue: number | null;
  eps: number | null;
  marketValue: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  currency: string;
  sourceLastUpdateText: string;
  recalculateRatios: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="admin-page">
      <div class="admin-heading">
        <div class="admin-heading-content">
          <span class="eyebrow"><lucide-icon [img]="DatabaseIcon" size="15"></lucide-icon> العمليات وإدارة البيانات</span>
          <h1>بوابة إدارة عمليات ميزان EGX</h1>
          <p>إدارة كشوف المؤشرات، التحكم بمهام السحب اليومية والربع سنوية، وتعديل بيانات السوق يدوياً.</p>
        </div>
      </div>

      <!-- TAB 1: SCRAPING & FAIR VALUE RUNNER -->
      <div *ngIf="activeTab === 'scraping'" class="admin-card">
        <h2>مهام السحب الآلي لبيانات السوق</h2>
        <p class="muted">
          نظام السحب مقسّم إلى حزمتين: حزمة الأسعار اليومية الحية (Live Daily) عند الساعة 4:00 عصراً، وحزمة البيانات الربع سنوية بطيئة التغير (Quarterly Fundamentals) في بداية كل ربع سنوي.
        </p>

        <!-- Scraper Bucket Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin: 24px 0;">
          
          <!-- Bucket 1: Daily Live-Price Scraper -->
          <div style="background: #fbfcfb; border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <strong style="font-size: 16px; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                  <lucide-icon [img]="ClockIcon" size="18"></lucide-icon>
                  سحب الأسعار المباشرة (Daily Live-Price)
                </strong>
                <span class="live-dot" *ngIf="isDailyRunning"></span>
              </div>
              <p style="font-size: 13px; color: var(--muted-foreground); margin: 0 0 14px; line-height: 1.5;">
                يسحب أسعار الإغلاق، الافتتاح، الأدنى والأعلى، ومستويات الدعم والمقاومة لجميع الأسهم.
              </p>
              <div style="font-size: 12px; background: white; border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px;">
                <div style="margin-bottom: 6px;"><strong>الجدول التلقائي:</strong> يومياً في تمام 4:00 عصراً بتوقيت القاهرة</div>
                <div><strong>آخر تشغيل مسجل:</strong> {{ getBucketLastRun('LiveDaily') }}</div>
              </div>

              <!-- Automation Toggle -->
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin-bottom: 16px;"
                   [style.background]="isJobEnabled('LiveDaily') ? '#f0fdf4' : '#fef2f2'"
                   [style.borderColor]="isJobEnabled('LiveDaily') ? '#bbf7d0' : '#fecaca'">
                <div>
                  <div style="font-size: 13px; font-weight: 600;" [style.color]="isJobEnabled('LiveDaily') ? '#166534' : '#991b1b'">
                    {{ isJobEnabled('LiveDaily') ? 'التشغيل التلقائي مُفعَّل' : 'التشغيل التلقائي مُعطَّل' }}
                  </div>
                  <div style="font-size: 11px; color: var(--muted-foreground);">
                    {{ isJobEnabled('LiveDaily') ? 'يعمل مجدولاً في الساعة 4:00 عصراً' : 'لن يتم تنفيذ الجدول التلقائي' }}
                  </div>
                </div>
                <button
                  type="button"
                  (click)="toggleJobSetting('LiveDaily')"
                  [disabled]="togglingJobKey === 'LiveDaily'"
                  class="btn btn-outline"
                  style="font-size: 12px; padding: 4px 10px; border-radius: 6px;"
                  [style.borderColor]="isJobEnabled('LiveDaily') ? '#16a34a' : '#dc2626'"
                  [style.color]="isJobEnabled('LiveDaily') ? '#16a34a' : '#dc2626'">
                  {{ isJobEnabled('LiveDaily') ? 'تعطيل الآلي' : 'تفعيل الآلي' }}
                </button>
              </div>
            </div>

            <button class="btn btn-primary" (click)="triggerDailyScrape()" [disabled]="isScrapingRunning" style="width: 100%; justify-content: center;">
              <lucide-icon [img]="PlayIcon" size="16"></lucide-icon>
              {{ isDailyRunning ? 'جارٍ السحب اليومي...' : 'تشغيل السحب اليومي الآن (Run Daily)' }}
            </button>
          </div>

          <!-- Bucket 2: Quarterly Slow-Changing Scraper -->
          <div style="background: #fbfcfb; border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <strong style="font-size: 16px; color: #1e40af; display: flex; align-items: center; gap: 8px;">
                  <lucide-icon [img]="CalendarIcon" size="18"></lucide-icon>
                  سحب الأساسيات الربع سنوية (Quarterly Slow)
                </strong>
                <span class="live-dot" *ngIf="isQuarterlyRunning"></span>
              </div>
              <p style="font-size: 13px; color: var(--muted-foreground); margin: 0 0 14px; line-height: 1.5;">
                يسحب مكررات الربحية P/E، مضاعف القيمة الدفترية P/B، ربحية السهم EPS، القيمة الدفترية، الاسمية، والسوقية.
              </p>
              <div style="font-size: 12px; background: white; border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px;">
                <div style="margin-bottom: 6px;"><strong>الجدول التلقائي:</strong> أول يوم في (يناير/أبريل/يوليو/أكتوبر) 9:00 صباحاً</div>
                <div><strong>آخر تشغيل مسجل:</strong> {{ getBucketLastRun('SlowQuarterly') }}</div>
              </div>

              <!-- Automation Toggle -->
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; margin-bottom: 16px;"
                   [style.background]="isJobEnabled('SlowQuarterly') ? '#eff6ff' : '#fef2f2'"
                   [style.borderColor]="isJobEnabled('SlowQuarterly') ? '#bfdbfe' : '#fecaca'">
                <div>
                  <div style="font-size: 13px; font-weight: 600;" [style.color]="isJobEnabled('SlowQuarterly') ? '#1e40af' : '#991b1b'">
                    {{ isJobEnabled('SlowQuarterly') ? 'التشغيل التلقائي مُفعَّل' : 'التشغيل التلقائي مُعطَّل' }}
                  </div>
                  <div style="font-size: 11px; color: var(--muted-foreground);">
                    {{ isJobEnabled('SlowQuarterly') ? 'يعمل مجدولاً ربع سنوياً' : 'لن يتم تنفيذ الجدول التلقائي' }}
                  </div>
                </div>
                <button
                  type="button"
                  (click)="toggleJobSetting('SlowQuarterly')"
                  [disabled]="togglingJobKey === 'SlowQuarterly'"
                  class="btn btn-outline"
                  style="font-size: 12px; padding: 4px 10px; border-radius: 6px;"
                  [style.borderColor]="isJobEnabled('SlowQuarterly') ? '#2563eb' : '#dc2626'"
                  [style.color]="isJobEnabled('SlowQuarterly') ? '#2563eb' : '#dc2626'">
                  {{ isJobEnabled('SlowQuarterly') ? 'تعطيل الآلي' : 'تفعيل الآلي' }}
                </button>
              </div>
            </div>

            <button class="btn btn-outline" (click)="triggerQuarterlyScrape()" [disabled]="isScrapingRunning" style="width: 100%; justify-content: center; border-color: #93c5fd; color: #1d4ed8;">
              <lucide-icon [img]="PlayIcon" size="16"></lucide-icon>
              {{ isQuarterlyRunning ? 'جارٍ السحب الربع سنوي...' : 'تشغيل السحب الربع سنوي الآن (Run Quarterly)' }}
            </button>
          </div>

          <!-- Bucket 3: Market Snapshots Background Job -->
          <div style="background: #fbfcfb; border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <strong style="font-size: 16px; color: #047857; display: flex; align-items: center; gap: 8px;">
                  <lucide-icon [img]="ClockIcon" size="18"></lucide-icon>
                  لقطات السوق والمؤشرات (Market Snapshots)
                </strong>
              </div>
              <p style="font-size: 13px; color: var(--muted-foreground); margin: 0 0 14px; line-height: 1.5;">
                تحديث أسعار المؤشرات والقطاعات من مباشر كل 15 دقيقة أثناء عمل البورصة + جولة ختامية بعد الإغلاق.
              </p>
              <div style="font-size: 12px; background: white; border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px;">
                <div style="margin-bottom: 6px;"><strong>الجدول التلقائي:</strong> كل 15 دقيقة (الأحد–الخميس، 9:45 ص–3:30 م)</div>
                <div><strong>نوع المهمة:</strong> خدمة خلفية مستمرة (Background Worker)</div>
              </div>

              <!-- Automation Toggle -->
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; margin-bottom: 16px;"
                   [style.background]="isJobEnabled('MarketSnapshots') ? '#ecfdf5' : '#fef2f2'"
                   [style.borderColor]="isJobEnabled('MarketSnapshots') ? '#a7f3d0' : '#fecaca'">
                <div>
                  <div style="font-size: 13px; font-weight: 600;" [style.color]="isJobEnabled('MarketSnapshots') ? '#065f46' : '#991b1b'">
                    {{ isJobEnabled('MarketSnapshots') ? 'التشغيل التلقائي مُفعَّل' : 'التشغيل التلقائي مُعطَّل' }}
                  </div>
                  <div style="font-size: 11px; color: var(--muted-foreground);">
                    {{ isJobEnabled('MarketSnapshots') ? 'يعمل دورياً كل 15 دقيقة أثناء التداول' : 'موقوف مؤقتاً ولن يسحب لقطات جديدة' }}
                  </div>
                </div>
                <button
                  type="button"
                  (click)="toggleJobSetting('MarketSnapshots')"
                  [disabled]="togglingJobKey === 'MarketSnapshots'"
                  class="btn btn-outline"
                  style="font-size: 12px; padding: 4px 10px; border-radius: 6px;"
                  [style.borderColor]="isJobEnabled('MarketSnapshots') ? '#059669' : '#dc2626'"
                  [style.color]="isJobEnabled('MarketSnapshots') ? '#059669' : '#dc2626'">
                  {{ isJobEnabled('MarketSnapshots') ? 'تعطيل الآلي' : 'تفعيل الآلي' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Scraping Progress View -->
        <div *ngIf="scrapeStatus" style="background: #fafbfa; border: 1px solid var(--border); border-radius: 14px; padding: 20px; margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="live-dot" *ngIf="isScrapingRunning"></span>
              <strong>الحالة الحالية:</strong>
              <span [ngSwitch]="scrapeStatus.status">
                <span *ngSwitchCase="'Running'" style="color: var(--primary); font-weight: 700;">جارٍ السحب المباشر (Running)</span>
                <span *ngSwitchCase="'Committing'" style="color: #b47b20; font-weight: 700;">جارٍ اعتماد وحفظ البيانات في قاعدة البيانات (Committing)...</span>
                <span *ngSwitchCase="'Completed'" style="color: var(--good); font-weight: 700;">اكتملت العملية بنجاح (Completed)</span>
                <span *ngSwitchCase="'Failed'" style="color: var(--bad); font-weight: 700;">فشلت العملية (Failed)</span>
                <span *ngSwitchDefault>متوقف (NotRunning)</span>
              </span>
              <span *ngIf="scrapeStatus.live?.triggeredBy" style="font-size: 12px; color: var(--muted-foreground); margin-right: 6px;">
                ({{ scrapeStatus.live?.triggeredBy }})
              </span>
            </div>

            <span *ngIf="scrapeStatus.live?.currentStockTicker" style="font-family: monospace; font-size: 13px; color: var(--primary);">
              السهم الجاري: [{{ scrapeStatus.live?.currentStockTicker }}]
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="progress-bar-container">
            <div class="progress-bar-fill" [style.width.%]="scrapeStatus.live?.percentComplete || (scrapeStatus.status === 'Completed' ? 100 : 0)"></div>
          </div>

          <div class="progress-stats" *ngIf="scrapeStatus.live">
            <span>المنجز: {{ scrapeStatus.live.processedCount }} من {{ scrapeStatus.live.totalStocks }} سهم ({{ scrapeStatus.live.percentComplete }}%)</span>
            <span>الناجح: {{ scrapeStatus.live.succeededCount }} | الفاشل: {{ scrapeStatus.live.failedCount }}</span>
            <span *ngIf="scrapeStatus.live.estimatedSecondsRemaining !== null">
              الوقت المتبقي التقديري: {{ scrapeStatus.live.estimatedSecondsRemaining }} ثانية
            </span>
          </div>
        </div>

        <!-- Last Run Summary -->
        <div *ngIf="scrapeStatus?.lastRun" style="margin-top: 24px;">
          <div style="font-weight: 600; margin-bottom: 8px; color: var(--muted-foreground);">
            <lucide-icon [img]="HistoryIcon" size="14"></lucide-icon> سجل آخر عملية سحب مسجلة:
          </div>
          <div class="table-scroll-x">
          <table class="admin-table">
            <thead>
              <tr>
                <th>تاريخ البدء</th>
                <th>تاريخ الانتهاء</th>
                <th>المدة</th>
                <th>إجمالي الأسهم</th>
                <th>الناجحة</th>
                <th>الفاشلة</th>
                <th>المشغّل / الحزمة</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ scrapeStatus!.lastRun!.runAt | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                <td>{{ scrapeStatus!.lastRun!.finishedAt | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                <td>{{ scrapeStatus!.lastRun!.durationSeconds }} ثانية</td>
                <td>{{ scrapeStatus!.lastRun!.totalStocks }}</td>
                <td style="color: var(--good);">{{ scrapeStatus!.lastRun!.succeededStocks }}</td>
                <td [style.color]="scrapeStatus!.lastRun!.failedStocks > 0 ? 'var(--bad)' : 'inherit'">
                  {{ scrapeStatus!.lastRun!.failedStocks }}
                </td>
                <td><strong>{{ scrapeStatus!.lastRun!.triggeredBy }}</strong></td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: MANUAL MARKET DATA EDITOR -->
      <div *ngIf="activeTab === 'market-data'" class="admin-card">
        <h2>تعديل بيانات السوق والتقييم للأسهم يدوياً</h2>
        <p class="muted">
          ابحث عن السهم وحدده لتعديل أسعار السوق ومؤشرات التقييم الأساسية. يتم حفظ كامل الحقول مع خيار إعادة حساب مكررات الربحية P/E ومضاعف القيمة الدفترية P/B تلقائياً.
        </p>

        <!-- Search / Select Stock Bar -->
        <div style="background: #fbfcfb; border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin: 20px 0;">
          <label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 8px;">
            البحث عن سهم بالرمز أو الاسم:
          </label>
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <div style="position: relative; flex: 1; min-width: 240px;">
              <input
                type="text"
                [(ngModel)]="stockSearchQuery"
                (input)="onSearchInput()"
                placeholder="أدخل رمز السهم (مثال: COMI, ORAS, ESRS)..."
                class="admin-form input"
                style="min-height: 42px; padding-inline-start: 36px;" />
              <lucide-icon [img]="SearchIcon" size="18" style="position: absolute; right: 10px; top: 12px; color: var(--muted-foreground);"></lucide-icon>
            </div>
            
            <select
              [(ngModel)]="selectedTicker"
              (change)="onStockSelected()"
              class="admin-form select"
              style="min-height: 42px; min-width: 260px; flex: 1;">
              <option value="">-- اختر من قائمة الأسهم ({{ filteredStocks.length }} سهم) --</option>
              <option *ngFor="let s of filteredStocks" [value]="s.ticker">
                {{ s.ticker }} - {{ s.nameAr || s.nameEn }}
              </option>
            </select>
          </div>

          <!-- Quick click chips when searching -->
          <div *ngIf="stockSearchQuery.trim() && filteredStocks.length > 0" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
            <span style="font-size: 11px; color: var(--muted-foreground); align-self: center; margin-left: 4px;">نتائج مطابقة سريعة:</span>
            <button
              *ngFor="let match of filteredStocks.slice(0, 10)"
              type="button"
              (click)="selectStockDirectly(match.ticker)"
              class="btn btn-outline"
              style="font-size: 11px; padding: 4px 8px; border-radius: 6px; background: white;"
              [style.borderColor]="selectedTicker === match.ticker ? 'var(--primary)' : 'var(--border)'"
              [style.color]="selectedTicker === match.ticker ? 'var(--primary)' : 'inherit'">
              <strong>{{ match.ticker }}</strong> <span style="margin-right: 4px; font-size: 10px; color: var(--muted-foreground);">({{ match.nameAr || match.nameEn }})</span>
            </button>
          </div>
        </div>

        <!-- Stock Details Header & Info -->
        <div *ngIf="loadingStock" style="padding: 30px; text-align: center; color: var(--muted-foreground);">
          جارٍ تحميل بيانات السهم...
        </div>

        <div *ngIf="selectedStockMarketData && !loadingStock" style="margin-top: 24px;">
          <!-- Header Banner -->
          <div style="background: var(--muted); border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 700;">
                  [{{ selectedStockMarketData.ticker }}] {{ selectedStockMarketData.nameAr || selectedStockMarketData.nameEn }}
                </h3>
                <span style="font-size: 12px; background: white; padding: 2px 8px; border-radius: 6px; border: 1px solid var(--border);">
                  {{ selectedStockMarketData.sectorNameAr || 'قطاع عام' }}
                </span>
                <span *ngIf="!selectedStockMarketData.fetchedAt" style="font-size: 11px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 6px; border: 1px solid #fcd34d;">
                  لا توجد بيانات سوق سابقة — سيتم الإنشاء عند الحفظ
                </span>
              </div>
              <div *ngIf="selectedStockMarketData.fetchedAt" style="font-size: 12px; color: var(--muted-foreground); margin-top: 6px;">
                آخر تحديث حي: <strong>{{ selectedStockMarketData.fetchedAt | date:'yyyy-MM-dd HH:mm' }}</strong>
                <span *ngIf="selectedStockMarketData.sourceLastUpdateText"> | المصدر: {{ selectedStockMarketData.sourceLastUpdateText }}</span>
              </div>
            </div>

            <!-- Shariah & Fair Value Context Pills -->
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <div style="font-size: 12px; background: white; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px;">
                <div style="color: var(--muted-foreground); font-size: 11px;">القيمة العادلة المحسوبة:</div>
                <strong style="color: var(--primary); font-size: 14px;">
                  {{ selectedStockMarketData.fairValue ? (selectedStockMarketData.fairValue | number:'1.2-2') + ' جنيه' : 'غير متوفرة' }}
                </strong>
                <span *ngIf="selectedStockMarketData.priceComparison" style="font-size: 11px; margin-right: 4px;" [style.color]="selectedStockMarketData.priceComparison === 'Cheap' ? 'var(--good)' : (selectedStockMarketData.priceComparison === 'Expensive' ? 'var(--bad)' : 'inherit')">
                  ({{ selectedStockMarketData.priceComparison === 'Cheap' ? 'أرخص من العادلة' : (selectedStockMarketData.priceComparison === 'Expensive' ? 'أعلى من العادلة' : (selectedStockMarketData.priceComparison === 'Fair' ? 'قريبة من العادلة' : 'لا يمكن حساب القيمة العادلة')) }})
                </span>
              </div>

              <div style="font-size: 12px; background: white; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px;">
                <div style="color: var(--muted-foreground); font-size: 11px;">حكم الشريعة:</div>
                <strong [style.color]="selectedStockMarketData.shariahStatus === 'Compliant' ? 'var(--good)' : 'var(--bad)'">
                  {{ selectedStockMarketData.shariahStatus === 'Compliant' ? 'متوافق' : (selectedStockMarketData.shariahStatus || 'غير محدد') }}
                </strong>
                <span *ngIf="selectedStockMarketData.shariahPct !== null" style="font-size: 11px; margin-right: 4px;">
                  ({{ selectedStockMarketData.shariahPct }}% تطهير)
                </span>
              </div>
            </div>
          </div>

          <!-- Edit Form -->
          <form (submit)="saveMarketData($event)" style="margin-top: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
              
              <!-- Closing Price -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  سعر الإغلاق الحالي (Closing Price) *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  [(ngModel)]="marketForm.closingPrice"
                  name="closingPrice"
                  class="admin-form input"
                  required />
              </div>

              <!-- Open -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  سعر الافتتاح (Open)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  [(ngModel)]="marketForm.open"
                  name="open"
                  class="admin-form input" />
              </div>

              <!-- High -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  أعلى سعر (High)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  [(ngModel)]="marketForm.high"
                  name="high"
                  class="admin-form input" />
              </div>

              <!-- Low -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  أدنى سعر (Low)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  [(ngModel)]="marketForm.low"
                  name="low"
                  class="admin-form input" />
              </div>

              <!-- Currency -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  العملة (Currency)
                </label>
                <input
                  type="text"
                  [(ngModel)]="marketForm.currency"
                  name="currency"
                  placeholder="EGP"
                  class="admin-form input" />
              </div>

              <!-- Nominal Value -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  القيمة الاسمية (Nominal Value)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  [(ngModel)]="marketForm.nominalValue"
                  name="nominalValue"
                  class="admin-form input" />
              </div>

              <!-- Book Value -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  القيمة الدفترية (Book Value)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  [(ngModel)]="marketForm.bookValue"
                  name="bookValue"
                  class="admin-form input" />
              </div>

              <!-- EPS -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  ربحية السهم (EPS)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  [(ngModel)]="marketForm.eps"
                  name="eps"
                  class="admin-form input" />
              </div>

              <!-- Market Value / Cap -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  القيمة السوقية (Market Value)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  [(ngModel)]="marketForm.marketValue"
                  name="marketValue"
                  class="admin-form input" />
              </div>

              <!-- P/E Ratio -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  مكرر الربحية (P/E Ratio)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  [(ngModel)]="marketForm.peRatio"
                  name="peRatio"
                  [disabled]="marketForm.recalculateRatios"
                  class="admin-form input" />
                <span *ngIf="marketForm.recalculateRatios" style="font-size: 11px; color: var(--primary);">
                  يتم حسابه تلقائياً من (السعر ÷ EPS)
                </span>
              </div>

              <!-- P/B Ratio -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  مضاعف القيمة الدفترية (P/B Ratio)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  [(ngModel)]="marketForm.pbRatio"
                  name="pbRatio"
                  [disabled]="marketForm.recalculateRatios"
                  class="admin-form input" />
                <span *ngIf="marketForm.recalculateRatios" style="font-size: 11px; color: var(--primary);">
                  يتم حسابه تلقائياً من (السعر ÷ الدفترية)
                </span>
              </div>

              <!-- Source Note -->
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                  ملاحظة مصدر البيانات (Source text)
                </label>
                <input
                  type="text"
                  [(ngModel)]="marketForm.sourceLastUpdateText"
                  name="sourceLastUpdateText"
                  placeholder="تعديل يدوي"
                  class="admin-form input" />
              </div>

            </div>

            <!-- Recalculate Ratios Checkbox Option -->
            <div style="margin-top: 18px; background: #fbfcfb; border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
                <input
                  type="checkbox"
                  [(ngModel)]="marketForm.recalculateRatios"
                  name="recalculateRatios"
                  style="width: 18px; height: 18px; accent-color: var(--primary);" />
                <span>
                  <strong>إعادة احتساب P/E و P/B تلقائياً</strong> (بناءً على السعر الجديد وقيم EPS والقيمة الدفترية المدخلة)
                </span>
              </label>
            </div>

            <!-- Form Error or Success Result -->
            <div *ngIf="saveError" class="admin-result error">
              {{ saveError }}
            </div>

            <div *ngIf="saveSuccessResult" class="admin-result success">
              <div style="font-weight: 700; margin-bottom: 4px; font-size: 15px;">
                تم حفظ بيانات السهم [{{ saveSuccessResult.ticker }}] وإعادة احتساب القيمة العادلة بنجاح!
              </div>
              <div style="display: flex; gap: 18px; margin-top: 6px; flex-wrap: wrap;">
                <span *ngIf="saveSuccessResult.fairValue">القيمة العادلة الجديدة: <strong style="color: var(--primary); font-size: 14px;">{{ saveSuccessResult.fairValue | number:'1.2-2' }} جنيه</strong></span>
                <span>الحزمة الحية: <strong>محدثة</strong></span>
                <span>الحزمة الدورية: <strong>محدثة</strong></span>
                <span>وقت التحديث: {{ saveSuccessResult.fetchedAt | date:'yyyy-MM-dd HH:mm:ss' }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 12px; margin-top: 20px; align-items: center;">
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="savingMarketData">
                <lucide-icon [img]="SaveIcon" size="16"></lucide-icon>
                {{ savingMarketData ? 'جارٍ حفظ التعديلات...' : 'حفظ بيانات السوق' }}
              </button>

<button
                type="button"
                class="btn btn-outline"
                (click)="resetMarketForm()"
                [disabled]="savingMarketData">
                <lucide-icon [img]="RotateCcwIcon" size="16"></lucide-icon>
                استعادة القيم الأصلية
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- TAB: SHARIAH MANUAL EDIT -->
      <div *ngIf="activeTab === 'shariah-edit'" class="admin-card">
        <h2>تعديل البيانات الشرعية للأسهم يدوياً</h2>
        <p class="muted">
          ابحث عن السهم وحدده لتعديل البيانات الشرعية يدوياً (تصنيف النشاط، مطابقة النشاط الأساسي، نسبة الإيراد المحرم، نسبة القروض والفوائد).
          القيم المدخلة هنا تطبق على "بورصة حلال" فقط (EGX 33، DFM، AAOIFI، S&P، KLSI) وتجاوز قيم التغذية.
        </p>

        <!-- Search / Select Stock Bar -->
        <div style="background: #fbfcfb; border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin: 20px 0;">
          <label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 8px;">
            البحث عن سهم بالرمز أو الاسم:
          </label>
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <div style="position: relative; flex: 1; min-width: 240px;">
              <input
                type="text"
                [(ngModel)]="shariahStockSearchQuery"
                (input)="onShariahSearchInput()"
                placeholder="أدخل رمز السهم (مثال: COMI, ORAS, ESRS)..."
                class="admin-form input"
                style="min-height: 42px; padding-inline-start: 36px;" />
              <lucide-icon [img]="SearchIcon" size="18" style="position: absolute; right: 10px; top: 12px; color: var(--muted-foreground);"></lucide-icon>
            </div>
            
            <select
              [(ngModel)]="shariahSelectedTicker"
              (change)="onShariahStockSelected()"
              class="admin-form select"
              style="min-height: 42px; min-width: 260px; flex: 1;">
              <option value="">-- اختر من قائمة الأسهم ({{ filteredShariahStocks.length }} سهم) --</option>
              <option *ngFor="let s of filteredShariahStocks" [value]="s.ticker">
                {{ s.ticker }} - {{ s.nameAr || s.nameEn }}
              </option>
            </select>
          </div>

          <!-- Quick click chips when searching -->
          <div *ngIf="shariahStockSearchQuery.trim() && filteredShariahStocks.length > 0" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
            <span style="font-size: 11px; color: var(--muted-foreground); align-self: center; margin-left: 4px;">نتائج مطابقة سريعة:</span>
            <button
              *ngFor="let match of filteredShariahStocks.slice(0, 10)"
              type="button"
              (click)="selectShariahStockDirectly(match.ticker)"
              class="btn btn-outline"
              style="font-size: 11px; padding: 4px 8px; border-radius: 6px; background: white;"
              [style.borderColor]="shariahSelectedTicker === match.ticker ? 'var(--primary)' : 'var(--border)'"
              [style.color]="shariahSelectedTicker === match.ticker ? 'var(--primary)' : 'inherit'">
              <strong>{{ match.ticker }}</strong> <span style="margin-right: 4px; font-size: 10px; color: var(--muted-foreground);">({{ match.nameAr || match.nameEn }})</span>
            </button>
          </div>
        </div>

        <!-- Stock Details Header & Info -->
        <div *ngIf="shariahLoadingStock" style="padding: 30px; text-align: center; color: var(--muted-foreground);">
          جارٍ تحميل بيانات السهم...
        </div>

        <div *ngIf="shariahSelectedStockMarketData && !shariahLoadingStock" style="margin-top: 24px;">
          <!-- Header Banner -->
          <div style="background: var(--muted); border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 700;">
                  [{{ shariahSelectedStockMarketData.ticker }}] {{ shariahSelectedStockMarketData.nameAr || shariahSelectedStockMarketData.nameEn }}
                </h3>
                <span style="font-size: 12px; background: white; padding: 2px 8px; border-radius: 6px; border: 1px solid var(--border);">
                  {{ shariahSelectedStockMarketData.sectorNameAr || 'قطاع عام' }}
                </span>
                <span *ngIf="!shariahSelectedStockMarketData.fetchedAt" style="font-size: 11px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 6px; border: 1px solid #fcd34d;">
                  لا توجد بيانات سوق سابقة — سيتم الإنشاء عند الحفظ
                </span>
              </div>
              <div *ngIf="shariahSelectedStockMarketData.fetchedAt" style="font-size: 12px; color: var(--muted-foreground); margin-top: 6px;">
                آخر تحديث حي: <strong>{{ shariahSelectedStockMarketData.fetchedAt | date:'yyyy-MM-dd HH:mm' }}</strong>
                <span *ngIf="shariahSelectedStockMarketData.sourceLastUpdateText"> | المصدر: {{ shariahSelectedStockMarketData.sourceLastUpdateText }}</span>
              </div>
            </div>

            <!-- Shariah & Fair Value Context Pills -->
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <div style="font-size: 12px; background: white; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px;">
                <div style="color: var(--muted-foreground); font-size: 11px;">القيمة العادلة المحسوبة:</div>
                <strong style="color: var(--primary); font-size: 14px;">
                  {{ shariahSelectedStockMarketData.fairValue ? (shariahSelectedStockMarketData.fairValue | number:'1.2-2') + ' جنيه' : 'غير متوفرة' }}
                </strong>
                <span *ngIf="shariahSelectedStockMarketData.priceComparison" style="font-size: 11px; margin-right: 4px;" [style.color]="shariahSelectedStockMarketData.priceComparison === 'Cheap' ? 'var(--good)' : (shariahSelectedStockMarketData.priceComparison === 'Expensive' ? 'var(--bad)' : 'inherit')">
                  ({{ shariahSelectedStockMarketData.priceComparison === 'Cheap' ? 'أرخص من العادلة' : (shariahSelectedStockMarketData.priceComparison === 'Expensive' ? 'أعلى من العادلة' : (shariahSelectedStockMarketData.priceComparison === 'Fair' ? 'قريبة من العادلة' : 'لا يمكن حساب القيمة العادلة')) }})
                </span>
              </div>

              <div style="font-size: 12px; background: white; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px;">
                <div style="color: var(--muted-foreground); font-size: 11px;">حكم الشريعة:</div>
                <strong [style.color]="shariahSelectedStockMarketData.shariahStatus === 'Compliant' ? 'var(--good)' : 'var(--bad)'">
                  {{ shariahSelectedStockMarketData.shariahStatus === 'Compliant' ? 'متوافق' : (shariahSelectedStockMarketData.shariahStatus || 'غير محدد') }}
                </strong>
                <span *ngIf="shariahSelectedStockMarketData.shariahPct !== null" style="font-size: 11px; margin-right: 4px;">
                  ({{ shariahSelectedStockMarketData.shariahPct }}% تطهير)
                </span>
              </div>
            </div>
          </div>

          <!-- Shariah Manual Overrides Section -->
          <div *ngIf="shariahOverrides" style="margin-top: 32px;">
            <div style="background: #fbfcfb; border: 1px solid var(--border); border-radius: 14px; padding: 20px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin: 0; font-size: 16px; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                  <lucide-icon [img]="Edit3Icon" size="18"></lucide-icon>
                  بيانات شرعية (يدوي)
                </h3>
                <span style="font-size: 11px; background: #ede9fe; color: #5b21b6; padding: 3px 10px; border-radius: 999px;">
                  يطبق على "بورصة حلال" فقط (EGX 33، DFM، AAOIFI، S&P، KLSI)
                </span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                <!-- Core Activity Compliant -->
                <div style="background: white; border: 1px solid var(--border); border-radius: 10px; padding: 14px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <label style="font-size: 12px; font-weight: 600; margin: 0;">تصنيف النشاط + مطابقة النشاط الأساسي</label>
                    <span *ngIf="shariahOverrides.overrideCoreActivityCompliant !== null" style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 999px; border: 1px solid #fcd34d;">
                      معدّل يدويًا
                    </span>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                      <input
                        type="checkbox"
                        [(ngModel)]="shariahOverrideForm.coreActivityCompliantOverride"
                        name="coreActivityCompliantOverride"
                        style="width: 18px; height: 18px; accent-color: var(--primary);" />
                      <span>مطابق للنشاط الأساسي (CoreActivityCompliant)</span>
                    </label>
                  </div>
                  <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 120px;">
                      <label style="font-size: 11px; color: var(--muted-foreground); display: block; margin-bottom: 2px;">التصنيف (عربي)</label>
                      <input
                        type="text"
                        [(ngModel)]="shariahOverrideForm.categoryArOverride"
                        name="categoryArOverride"
                        class="admin-form input"
                        placeholder="من المصدر"
                        style="font-size: 12px;" />
                      <div *ngIf="shariahOverrides.overrideCategoryAr" style="font-size: 10px; color: #92400e; margin-top: 2px;">
                        التغذية: {{ shariahOverrides.feedCategoryAr }}
                      </div>
                    </div>
                    <div style="flex: 1; min-width: 120px;">
                      <label style="font-size: 11px; color: var(--muted-foreground); display: block; margin-bottom: 2px;">التصنيف (إنجليزي)</label>
                      <input
                        type="text"
                        [(ngModel)]="shariahOverrideForm.categoryEnOverride"
                        name="categoryEnOverride"
                        class="admin-form input"
                        placeholder="من المصدر"
                        style="font-size: 12px;" />
                      <div *ngIf="shariahOverrides.overrideCategoryEn" style="font-size: 10px; color: #92400e; margin-top: 2px;">
                        التغذية: {{ shariahOverrides.feedCategoryEn }}
                      </div>
                    </div>
                  </div>
                  <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <button
                      type="button"
                      class="btn btn-primary"
                      style="font-size: 12px; padding: 6px 12px;"
                      (click)="saveShariahOverrides()"
                      [disabled]="savingShariahOverrides">
                      <lucide-icon [img]="SaveIcon" size="14"></lucide-icon>
                      حفظ الكل
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline"
                      style="font-size: 11px; padding: 4px 10px; border-color: #fecaca; color: var(--bad);"
                      (click)="resetShariahOverride('CoreActivityCompliant')"
                      [disabled]="savingShariahOverrides || shariahOverrides.overrideCoreActivityCompliant === null"
                      title="استعادة قيمة التغذية لمطابقة النشاط الأساسي">
                      <lucide-icon [img]="RotateCcwIcon" size="13"></lucide-icon>
                      استعادة النشاط
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline"
                      style="font-size: 11px; padding: 4px 10px; border-color: #fecaca; color: var(--bad);"
                      (click)="resetShariahOverride('CategoryAr')"
                      [disabled]="savingShariahOverrides || shariahOverrides.overrideCategoryAr === null"
                      title="استعادة قيمة التغذية للتصنيف العربي">
                      <lucide-icon [img]="RotateCcwIcon" size="13"></lucide-icon>
                      استعادة التصنيف (عربي)
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline"
                      style="font-size: 11px; padding: 4px 10px; border-color: #fecaca; color: var(--bad);"
                      (click)="resetShariahOverride('CategoryEn')"
                      [disabled]="savingShariahOverrides || shariahOverrides.overrideCategoryEn === null"
                      title="استعادة قيمة التغذية للتصنيف الإنجليزي">
                      <lucide-icon [img]="RotateCcwIcon" size="13"></lucide-icon>
                      استعادة التصنيف (إنجليزي)
                    </button>
                  </div>
                </div>

                <!-- Haram Revenue Percentage -->
                <div style="background: white; border: 1px solid var(--border); border-radius: 10px; padding: 14px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <label style="font-size: 12px; font-weight: 600; margin: 0;">نسبة الإيراد المحرم (%)</label>
                    <span *ngIf="shariahOverrides.overrideHaramRevenuePercentage !== null" style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 999px; border: 1px solid #fcd34d;">
                      معدّل يدويًا
                    </span>
                  </div>
                  <div style="display: flex; gap: 10px; align-items: end; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 140px;">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        [(ngModel)]="shariahOverrideForm.haramRevenuePercentageOverride"
                        name="haramRevenuePercentageOverride"
                        class="admin-form input"
                        placeholder="من المصدر"
                        style="font-size: 13px; font-weight: 600;" />
                      <div *ngIf="shariahOverrides.overrideHaramRevenuePercentage !== null" style="font-size: 10px; color: #92400e; margin-top: 2px;">
                        التغذية: {{ shariahOverrides.feedHaramRevenuePercentage !== null ? (shariahOverrides.feedHaramRevenuePercentage | number:'1.2-2') + '%' : '—' }}
                      </div>
                    </div>
                    <div style="flex: 1; min-width: 140px;">
                      <strong style="font-size: 13px; color: var(--primary);">فعال: </strong>
                      <span style="font-size: 13px; font-weight: 600;">
                        {{ shariahOverrides.effectiveHaramRevenuePercentage !== null ? (shariahOverrides.effectiveHaramRevenuePercentage | number:'1.2-2') + '%' : '—' }}
                      </span>
                    </div>
                  </div>
                  <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <button
                      type="button"
                      class="btn btn-outline"
                      style="font-size: 11px; padding: 4px 10px; border-color: #fecaca; color: var(--bad);"
                      (click)="resetShariahOverride('HaramRevenuePercentage')"
                      [disabled]="savingShariahOverrides || shariahOverrides.overrideHaramRevenuePercentage === null"
                      title="استعادة قيمة التغذية لنسبة الإيراد المحرم">
                      <lucide-icon [img]="RotateCcwIcon" size="13"></lucide-icon>
                      استعادة للتغذية
                    </button>
                  </div>
                </div>

                <!-- Loans Percentage -->
                <div style="background: white; border: 1px solid var(--border); border-radius: 10px; padding: 14px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <label style="font-size: 12px; font-weight: 600; margin: 0;">نسبة القروض والفوائد (%)</label>
                    <span *ngIf="shariahOverrides.overrideLoansPercentage !== null" style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 999px; border: 1px solid #fcd34d;">
                      معدّل يدويًا
                    </span>
                  </div>
                  <div style="display: flex; gap: 10px; align-items: end; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 140px;">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        [(ngModel)]="shariahOverrideForm.loansPercentageOverride"
                        name="loansPercentageOverride"
                        class="admin-form input"
                        placeholder="من المصدر"
                        style="font-size: 13px; font-weight: 600;" />
                      <div *ngIf="shariahOverrides.overrideLoansPercentage !== null" style="font-size: 10px; color: #92400e; margin-top: 2px;">
                        التغذية: {{ shariahOverrides.feedLoansPercentage !== null ? (shariahOverrides.feedLoansPercentage | number:'1.2-2') + '%' : '—' }}
                      </div>
                    </div>
                    <div style="flex: 1; min-width: 140px;">
                      <strong style="font-size: 13px; color: var(--primary);">فعال: </strong>
                      <span style="font-size: 13px; font-weight: 600;">
                        {{ shariahOverrides.effectiveLoansPercentage !== null ? (shariahOverrides.effectiveLoansPercentage | number:'1.2-2') + '%' : '—' }}
                      </span>
                    </div>
                  </div>
                  <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <button
                      type="button"
                      class="btn btn-outline"
                      style="font-size: 11px; padding: 4px 10px; border-color: #fecaca; color: var(--bad);"
                      (click)="resetShariahOverride('LoansPercentage')"
                      [disabled]="savingShariahOverrides || shariahOverrides.overrideLoansPercentage === null"
                      title="استعادة قيمة التغذية لنسبة القروض والفوائد">
                      <lucide-icon [img]="RotateCcwIcon" size="13"></lucide-icon>
                      استعادة للتغذية
                    </button>
                  </div>
                </div>
              </div>

              <!-- Bourse Halal 5 Standards Preview -->
              <div *ngIf="shariahOverrides.effectiveHaramRevenuePercentage !== null || shariahOverrides.effectiveLoansPercentage !== null" style="margin-top: 20px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;">
                <div style="font-size: 12px; font-weight: 600; color: #166534; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                  <lucide-icon [img]="CheckCircleIcon" size="16"></lucide-icon>
                  معاينة معايير "بورصة حلال" الخمس (باستخدام القيم الفعالة)
                </div>
                <div class="table-scroll-x">
                  <table class="admin-table" style="font-size: 12px;">
                    <thead>
                      <tr>
                        <th>المعيار</th>
                        <th>حد الإيراد المحرم</th>
                        <th>حد المديونية</th>
                        <th>الإيراد الفعلي</th>
                        <th>المديونية الفعلية</th>
                        <th>النتيجة</th>
                      </tr>
                    </thead>
                    <tbody>
                  <tr *ngFor="let s of bourseHalalStandards">
                        <td><strong>{{ s.name }}</strong></td>
                        <td>{{ s.revenueMax != null ? s.revenueMax + '%' : '—' }}</td>
                        <td>{{ s.debtMax }}%</td>
                        <td>{{ shariahOverrides.effectiveHaramRevenuePercentage !== null ? (shariahOverrides.effectiveHaramRevenuePercentage | number:'1.2-2') + '%' : '—' }}</td>
                        <td>{{ shariahOverrides.effectiveLoansPercentage !== null ? (shariahOverrides.effectiveLoansPercentage | number:'1.2-2') + '%' : '—' }}</td>
                        <td>
                          <span [style.color]="s.passes ? 'var(--good)' : 'var(--bad)'" style="font-weight: 600;">
                            {{ s.passes ? 'اجتاز ✓' : 'لم يجتاز ✗' }}
                          </span>
                        </td>
                      </tr>
                      <!-- Scholars criterion (informational, not counted) -->
                      <tr style="border-top: 2px dashed #e2e8f0; opacity: 0.8;">
                        <td><strong>{{ scholarsStandardNameAr }}</strong><br><small style="font-weight:400;color:#64748b;">{{ scholarsStandardNameEn }} · استرشادي</small></td>
                        <td style="color:#94a3b8;">—</td>
                        <td>{{ scholarsDebtMaxVal }}%</td>
                        <td style="color:#94a3b8;">—</td>
                        <td>{{ shariahOverrides.effectiveLoansPercentage !== null ? (shariahOverrides.effectiveLoansPercentage | number:'1.2-2') + '%' : '—' }}</td>
                        <td>
                          <span *ngIf="shariahOverrides.effectiveLoansPercentage !== null"
                                [style.color]="(shariahOverrides.effectiveLoansPercentage! <= scholarsDebtMaxVal) ? 'var(--good)' : 'var(--bad)'"
                                style="font-weight: 600;">
                            {{ (shariahOverrides.effectiveLoansPercentage! <= scholarsDebtMaxVal) ? 'اجتاز ✓' : 'لم يجتاز ✗' }}
                          </span>
                          <span *ngIf="shariahOverrides.effectiveLoansPercentage === null" style="color:#94a3b8;">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style="font-size: 11px; color: #166534; margin-top: 8px;">
                  اجتاز <strong>{{ passedStandardsCount }} من 5</strong> معايير رئيسية.
                  <span *ngIf="passedStandardsCount > 0" style="margin-right: 8px;">→ الحكم العام: متوافق</span>
                  <span *ngIf="passedStandardsCount === 0 && shariahOverrides!.effectiveLoansPercentage !== null && shariahOverrides!.effectiveLoansPercentage! <= scholarsDebtMaxVal" style="margin-right: 8px; color: #d97706;">
                    → الحكم العام: متوافق (بحسب بعض العلماء الأفراد)
                  </span>
                  <span *ngIf="passedStandardsCount === 0 && (shariahOverrides!.effectiveLoansPercentage === null || shariahOverrides!.effectiveLoansPercentage! > scholarsDebtMaxVal) && (shariahOverrides!.effectiveHaramRevenuePercentage !== null || shariahOverrides!.effectiveLoansPercentage !== null)" style="margin-right: 8px; color: var(--bad);">
                    → الحكم العام: غير متوافق
                  </span>
                </div>
              </div>

              <div *ngIf="shariahOverridesError" class="admin-result error" style="margin-top: 16px;">{{ shariahOverridesError }}</div>
              <div *ngIf="shariahOverridesSuccess" class="admin-result success" style="margin-top: 16px;">{{ shariahOverridesSuccess }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: INDEX EXCEL UPLOAD -->
      <div *ngIf="activeTab === 'upload'" class="admin-card">
        <h2>رفع ملف مكونات المؤشر (Excel .xls / .xlsx)</h2>
        <p class="muted">يتم استبدال كامل مكونات المؤشر المختار تلقائياً وتحديث أوزان الأسهم والقطاعات.</p>

        <form (submit)="onUploadSubmit($event)" class="admin-form">
          <label>
            اختر المؤشر المستهدف:
            <select [(ngModel)]="selectedUploadIndex" name="uploadIndex" required>
              <option value="">-- اختر مؤشراً --</option>
              <option *ngFor="let idx of indices" [value]="idx.code">
                {{ idx.code }} - {{ idx.nameAr }}
              </option>
            </select>
          </label>

          <label>
            ملف الإكسيل (.xlsx أو .xls):
            <input type="file" (change)="onFileSelected($event)" accept=".xlsx,.xls" required />
          </label>

          <div>
            <button type="submit" class="btn btn-primary" [disabled]="uploading || !selectedUploadIndex || !uploadFile">
              <lucide-icon [img]="UploadIcon" size="16"></lucide-icon>
              {{ uploading ? 'جارٍ رفع ومعالجة الملف...' : 'رفع واستبدال المكونات' }}
            </button>
          </div>
        </form>

        <!-- Upload Result View -->
        <div *ngIf="uploadResult" class="admin-result" [class.success]="uploadResult.status === 'Success'" [class.error]="uploadResult.status !== 'Success'">
          <div style="font-weight: 700; font-size: 15px; margin-bottom: 8px;">
            حالة المعالجة: {{ uploadResult.status }}
          </div>
          <div>{{ uploadResult.message }}</div>
          <div *ngIf="uploadResult.warning" style="margin-top: 10px; padding: 10px 14px; background: #fff4d9; border: 1px solid #fed7aa; border-radius: 8px; color: #b47b20; font-weight: 500;">
            ⚠️ {{ uploadResult.warning }}
          </div>
          <div style="display: flex; gap: 20px; margin-top: 10px; flex-wrap: wrap;">
            <span *ngIf="uploadResult.sectorsAdded !== undefined && uploadResult.sectorsAdded !== null">القطاعات المضافة: <strong>{{ uploadResult.sectorsAdded }}</strong></span>
            <span>الأسهم المضافة: <strong>{{ uploadResult.inserted }}</strong></span>
            <span>الأسهم المحدثة: <strong>{{ uploadResult.updated }}</strong></span>
            <span>الأسهم المتخطاة: <strong>{{ uploadResult.skipped }}</strong></span>
            <span>إجمالي المكونات: <strong>{{ uploadResult.totalConstituents }}</strong></span>
          </div>

          <div *ngIf="uploadResult.skippedDetails && uploadResult.skippedDetails.length" style="margin-top: 14px;">
            <strong>تفاصيل الصفوف المستبعدة:</strong>
            <div class="table-scroll-x">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>رقم الصف</th>
                  <th>الرمز / المعرف</th>
                  <th>السبب</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let d of uploadResult.skippedDetails">
                  <td>{{ d.rowNumber }}</td>
                  <td>{{ d.identifier }}</td>
                  <td>{{ d.reason }}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: SHARIAH SEED & REFRESH -->
      <div *ngIf="activeTab === 'shariah'" class="admin-card">
        <h2>تحديث وبذر بيانات الشريعة</h2>
        <p class="muted">
          تحديث آراء الشريعة لـ 7 جهات مستقلة مع مؤشرات AAOIFI و S&P من المصدر الخارجي المدمج، أو بذر خريطة الشريعة المسبقة.
        </p>

        <div style="display: flex; gap: 16px; margin: 20px 0; flex-wrap: wrap;">
          <button class="btn btn-primary" (click)="triggerShariahRefresh()" [disabled]="shariahRefreshing">
            <lucide-icon [img]="RefreshCwIcon" size="16"></lucide-icon>
            {{ shariahRefreshing ? 'جارٍ جلب وتحديث الشريعة...' : 'تحديث الشريعة المدمجة الآن (Refresh Merged Data)' }}
          </button>

          <button class="btn btn-outline" (click)="triggerShariahSeed()" [disabled]="shariahSeeding">
            <lucide-icon [img]="DatabaseIcon" size="16"></lucide-icon>
            {{ shariahSeeding ? 'جارٍ البذر...' : 'بذر خريطة الشريعة الافتراضية (Seed Shariah Map)' }}
          </button>
        </div>

        <!-- Optional JSON Override for Seeding -->
        <div style="margin-top: 16px;">
          <label class="muted" style="display: block; margin-bottom: 6px;">
            تجاوز حمولة JSON للبذر (اختياري - اتركه فارغاً لاستخدام shariah_map.json المدمج):
          </label>
          <textarea [(ngModel)]="seedJsonOverride" placeholder='{"COMI": {"status": "Compliant", "pct": 1.25, "note": "معتمد"}}' class="admin-form input"></textarea>
        </div>

        <!-- Shariah Results Views -->
        <div *ngIf="refreshResult" class="admin-result success">
          <div style="font-weight: 700; margin-bottom: 6px;">نتيجة تحديث الشريعة المدمجة:</div>
          <div>تم تحديث نسب التطهير لـ: <strong>{{ refreshResult.pctUpdatedCount }}</strong> سهم.</div>
          <div>تم التحديث الكامل لآراء الـ 7 جهات لـ: <strong>{{ refreshResult.stocksFullyRefreshedCount }}</strong> سهم.</div>
          <div *ngIf="refreshResult.message">{{ refreshResult.message }}</div>
        </div>

        <div *ngIf="seedResult" class="admin-result success">
          <div style="font-weight: 700; margin-bottom: 6px;">نتيجة بذر خريطة الشريعة:</div>
          <div>سجلات أضيفت: <strong>{{ seedResult.insertedCount }}</strong></div>
          <div>سجلات حُدثت: <strong>{{ seedResult.updatedCount }}</strong></div>
          <div>إجمالي المعالجة: <strong>{{ seedResult.totalProcessed }}</strong></div>
        </div>
      </div>

      <!-- TAB 5: FAISAL/OSOUL PDF REPORT UPLOAD -->
      <div *ngIf="activeTab === 'pdf-upload'" class="admin-card">
        <h2>رفع تقارير فيصل / أسطول (PDF)</h2>
        <p class="muted">
          رفع ملف PDF جديد لأحد المصدرين (بنك فيصل الإسلامي / أسطول) واستبدال الملف المخزن مسبقاً لهذا المصدر.
          بعد الرفع، شغّل "تحديث الشريعة المدمجة" (import-faisal-osoul) لتحديث روابط PDF في آراء الأسهم.
        </p>

        <!-- Current stored files status (DB record + file on disk, per source) -->
        <div class="admin-card" style="margin-bottom: 24px; padding: 16px; background: #fbfcfb; border: 1px solid var(--border); border-radius: 12px;">
          <h3 style="margin: 0 0 12px; font-size: 15px;">الملفات المخزنة حالياً:</h3>
          <div *ngIf="sourcePdfLoading" style="font-size: 13px; color: var(--muted-foreground);">جارٍ تحميل حالة الملفات المخزنة...</div>
          <div *ngIf="!sourcePdfLoading && sourcePdfError" class="admin-result error" style="color: var(--bad);">{{ sourcePdfError }}</div>
          <div *ngIf="!sourcePdfLoading && !sourcePdfError" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
            <div style="background: white; border: 1px solid var(--border); border-radius: 8px; padding: 12px;">
              <strong style="color: var(--primary);">بنك فيصل الإسلامي</strong>
              <div style="font-size: 12px; color: var(--muted-foreground); margin-top: 4px;" [ngSwitch]="getSourcePdfState('FaisalBank')?.status">
                <span *ngSwitchCase="'exists'">
                  موجود ({{ getSourcePdfState('FaisalBank')?.fileName }}<span *ngIf="getSourcePdfState('FaisalBank')?.sizeBytes != null"> — {{ formatFileSize(getSourcePdfState('FaisalBank')?.sizeBytes!) }}</span><span *ngIf="formatPdfDate(getSourcePdfState('FaisalBank')?.lastModifiedUtc)"> — {{ formatPdfDate(getSourcePdfState('FaisalBank')?.lastModifiedUtc) }}</span>)
                  <br><a [href]="getSourcePdfViewUrl('FaisalBank')" target="_blank" rel="noopener">View PDF</a>
                </span>
                <span *ngSwitchCase="'missing-file'" style="color: var(--bad);">
                  Referenced in database but file missing on server (مسجّل في قاعدة البيانات لكن الملف مفقود على الخادم<span *ngIf="getSourcePdfState('FaisalBank')?.fileName">: {{ getSourcePdfState('FaisalBank')?.fileName }}</span>)
                </span>
                <span *ngSwitchCase="'not-found'" style="color: var(--bad);">غير موجود</span>
                <span *ngSwitchDefault style="color: var(--bad);">غير موجود</span>
              </div>
            </div>
            <div style="background: white; border: 1px solid var(--border); border-radius: 8px; padding: 12px;">
              <strong style="color: #1e40af;">أسطول</strong>
              <div style="font-size: 12px; color: var(--muted-foreground); margin-top: 4px;" [ngSwitch]="getSourcePdfState('Ostoul')?.status">
                <span *ngSwitchCase="'exists'">
                  موجود ({{ getSourcePdfState('Ostoul')?.fileName }}<span *ngIf="getSourcePdfState('Ostoul')?.sizeBytes != null"> — {{ formatFileSize(getSourcePdfState('Ostoul')?.sizeBytes!) }}</span><span *ngIf="formatPdfDate(getSourcePdfState('Ostoul')?.lastModifiedUtc)"> — {{ formatPdfDate(getSourcePdfState('Ostoul')?.lastModifiedUtc) }}</span>)
                  <br><a [href]="getSourcePdfViewUrl('Ostoul')" target="_blank" rel="noopener">View PDF</a>
                </span>
                <span *ngSwitchCase="'missing-file'" style="color: var(--bad);">
                  Referenced in database but file missing on server (مسجّل في قاعدة البيانات لكن الملف مفقود على الخادم<span *ngIf="getSourcePdfState('Ostoul')?.fileName">: {{ getSourcePdfState('Ostoul')?.fileName }}</span>)
                </span>
                <span *ngSwitchCase="'not-found'" style="color: var(--bad);">غير موجود</span>
                <span *ngSwitchDefault style="color: var(--bad);">غير موجود</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload form -->
        <div style="background: #fbfcfb; border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
          <h3 style="margin: 0 0 16px; font-size: 15px;">رفع ملف جديد واستبدال القديم</h3>

          <!-- Source selector -->
          <div style="margin-bottom: 16px;">
            <label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 8px;">
              اختر المصدر:
            </label>
            <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
                <input type="radio" name="pdfSource" [(ngModel)]="selectedPdfSource" value="FaisalBank" style="accent-color: var(--primary);" />
                <span style="color: var(--primary);">بنك فيصل الإسلامي</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
                <input type="radio" name="pdfSource" [(ngModel)]="selectedPdfSource" value="Ostoul" style="accent-color: #1e40af;" />
                <span style="color: #1e40af;">أسطول</span>
              </label>
            </div>
          </div>

          <!-- Report date (optional) -->
          <div style="margin-bottom: 16px;">
            <label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 8px;">
              تاريخ التقرير (اختياري — للعرض فقط، لا يغيّر آراء الأسهم):
            </label>
            <input type="date" [(ngModel)]="pdfReportDate" class="admin-form input" style="max-width: 220px;" />
          </div>

          <!-- File picker -->
          <div style="margin-bottom: 16px;">
            <label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 8px;">
              ملف PDF (سيحل محل الملف الحالي للمصدر المحدد):
            </label>
            <input
              type="file"
              #pdfFileInput
              accept=".pdf"
              (change)="onPdfFileSelected($event)"
              class="admin-form input"
              style="max-width: 400px;" />
            <div *ngIf="selectedPdfFile" style="font-size: 12px; color: var(--muted-foreground); margin-top: 6px;">
              محدد: {{ selectedPdfFile.name }} ({{ formatFileSize(selectedPdfFile.size) }})
            </div>
          </div>

          <!-- Upload button -->
          <button
            class="btn btn-primary"
            (click)="uploadPdfReport()"
            [disabled]="pdfUploading || !selectedPdfFile"
            style="display: inline-flex; align-items: center; gap: 8px;">
            <lucide-icon [img]="UploadFileIcon" size="16"></lucide-icon>
            {{ pdfUploading ? 'جارٍ الرفع...' : 'رفع واستبدال الملف' }}
          </button>

          <!-- Result message -->
          <div *ngIf="pdfUploadResult" class="admin-result" [class.success]="pdfUploadResult.success" [class.error]="!pdfUploadResult.success" style="margin-top: 16px;">
            <div style="font-weight: 700; margin-bottom: 4px;">{{ pdfUploadResult.success ? 'تم الرفع بنجاح' : 'فشل الرفع' }}</div>
            <div>{{ pdfUploadResult.message }}</div>
            <div *ngIf="pdfUploadResult.success" style="font-size: 12px; color: var(--muted-foreground); margin-top: 8px;">
              الملف: {{ pdfUploadResult.fileName }} | المسار: {{ pdfUploadResult.storedAt }} | مرفوع في: {{ pdfUploadResult.uploadedAt }}
              <br> <strong>لا تنسَ تشغيل "تحديث الشريعة المدمجة" (import-faisal-osoul) لتحديث آراء الأسهم.</strong>
            </div>
          </div>

          <div *ngIf="pdfUploadError" class="admin-result error" style="margin-top: 16px; color: var(--bad);">
            {{ pdfUploadError }}
          </div>
        </div>
      </div>

      <!-- TAB 6: OPERATOR REVIEW CHECKLIST (stale / missing / deactivated) -->
      <div *ngIf="activeTab === 'review'" class="admin-card">
        <h2>قائمة مراجعة الأسهم القديمة والمحذوفة</h2>
        <p class="muted">
          الأسهم التالية مرشحة للمراجعة فقط: بياناتها قديمة في المصدر، أو غير موجودة في المصدر، أو معطّلة يدوياً.
          <strong>لا يقوم النظام بأي إجراء تلقائي</strong> — حدّد الأسهم يدوياً ثم اختر الإجراء المناسب:
          إعادة السحب (تحديث البيانات)، تأكيد الإيقاف، أو إعادة التفعيل.
        </p>

        <div style="display: flex; gap: 12px; margin: 20px 0; flex-wrap: wrap; align-items: center;">
          <button class="btn btn-outline" (click)="loadRemovalCandidates()" [disabled]="candidatesLoading">
            <lucide-icon [img]="RefreshCwIcon" size="16"></lucide-icon>
            {{ candidatesLoading ? 'جارٍ التحميل...' : 'تحديث القائمة' }}
          </button>
          <button class="btn btn-primary" (click)="refreshSelectedCandidates()" [disabled]="candidatesBusy || selectedTickers.size === 0">
            <lucide-icon [img]="PlayIcon" size="16"></lucide-icon>
            إعادة سحب المحدَّد ({{ selectedTickers.size }})
          </button>
          <button class="btn btn-outline" (click)="confirmSelectedCandidates()" [disabled]="candidatesBusy || selectedTickers.size === 0"
                  style="border-color: #fecaca; color: var(--bad);">
            <lucide-icon [img]="AlertTriangleIcon" size="16"></lucide-icon>
            تأكيد الإيقاف للمحدَّد
          </button>
          <button class="btn btn-outline" (click)="reactivateSelectedCandidates()" [disabled]="candidatesBusy || selectedTickers.size === 0">
            <lucide-icon [img]="RotateCcwIcon" size="16"></lucide-icon>
            إعادة تفعيل المحدَّد
          </button>
          <label style="font-size: 12px; color: var(--muted-foreground); display: flex; align-items: center; gap: 6px; margin-right: auto;">
            <input type="checkbox" [checked]="allCandidatesSelected" (change)="toggleSelectAllCandidates($any($event).target.checked)" />
            تحديد الكل ({{ removalCandidates.length }})
          </label>
        </div>

        <div *ngIf="candidatesMessage" class="admin-result" [class.success]="!candidatesError" [class.error]="candidatesError"
             style="background: #f5faf3; border: 1px solid #e3eede; border-radius: 12px; padding: 14px; margin-bottom: 16px;">
          {{ candidatesMessage }}
          <ul *ngIf="refreshSelectedResult?.outcomes?.length" style="margin: 8px 16px 0 0; font-size: 12px;">
            <li *ngFor="let o of refreshSelectedResult!.outcomes">
              <strong>{{ o.ticker }}</strong> —
              <span [style.color]="o.success ? 'var(--good)' : 'var(--bad)'">{{ o.success ? 'تم التحديث' : 'فشل' }}</span>
              <span *ngIf="o.message"> ({{ o.message }})</span>
            </li>
          </ul>
        </div>

        <div *ngIf="!candidatesLoading && removalCandidates.length === 0" class="muted" style="padding: 24px 0;">
          لا توجد أسهم مرشحة للمراجعة حالياً.
        </div>

        <div *ngIf="removalCandidates.length" class="table-scroll-x">
          <table class="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>الرمز</th>
                <th>الاسم</th>
                <th>القطاع</th>
                <th>سبب المراجعة</th>
                <th>آخر تحديث بالمصدر</th>
                <th>آخر إغلاق</th>
                <th>الحالة</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of removalCandidates">
                <td><input type="checkbox" [checked]="selectedTickers.has(c.ticker)" (change)="toggleCandidate(c.ticker, $any($event).target.checked)" /></td>
                <td><strong style="font-family: monospace;">{{ c.ticker }}</strong></td>
                <td>{{ c.nameAr || c.nameEn || '—' }}</td>
                <td style="font-size: 12px; color: var(--muted-foreground);">{{ c.sectorNameAr || '—' }}</td>
                <td>
                  <span style="font-size: 11px; padding: 3px 8px; border-radius: 999px;"
                        [style.background]="c.reason === 'Deactivated' ? '#fee2e2' : (c.reason === 'StaleData' ? '#fef3c7' : '#e0f2fe')"
                        [style.color]="c.reason === 'Deactivated' ? '#b91c1c' : (c.reason === 'StaleData' ? '#92400e' : '#075985')">
                    {{ reasonLabel(c.reason) }}
                  </span>
                </td>
                <td style="font-size: 12px;">{{ c.sourceLastUpdateText || '—' }}</td>
                <td>{{ c.lastClosingPrice != null ? (c.lastClosingPrice | number:'1.2-2') : '—' }}</td>
                <td style="font-size: 12px;" [style.color]="c.currentIsActive ? 'var(--good)' : 'var(--bad)'">
                  {{ c.currentIsActive ? 'فعَّال' : 'معطَّل' }} · {{ c.dataStatus }}
                </td>
                <td style="font-size: 11px; color: var(--muted-foreground);">{{ c.deactivationReason || c.lastSuccessfulUpdate || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 7: STOCKS / SECTORS / INDICES MANAGEMENT -->
      <div *ngIf="activeTab === 'stocks'" class="admin-card" style="padding: 0;">
        <div style="padding: 24px 28px 16px;">
          <h2 style="margin: 0 0 6px;">إدارة الأسهم والقطاعات والمؤشرات</h2>
          <p class="muted" style="margin: 0;">ابحث عن سهم لتعيينه لقطاع أو مؤشر أو لإنشاء سهم جديد. التعيين اليدوي لا يُستبدل بالرفع التلقائي.</p>
        </div>

        <!-- Search bar + create button -->
        <div style="padding: 0 28px 20px; display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;">
          <div style="flex: 1; min-width: 220px;">
            <label style="font-size: 12px; font-weight: 600; color: var(--muted-foreground); display: block; margin-bottom: 4px;">بحث بالرمز أو الاسم</label>
            <div style="position: relative;">
              <lucide-icon [img]="SearchIcon" size="15" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--muted-foreground);"></lucide-icon>
              <input type="text" class="form-input" style="padding-right: 32px; width: 100%; box-sizing: border-box;"
                     [(ngModel)]="mgmtSearch" (ngModelChange)="onMgmtSearchChange($event)"
                     placeholder="مثال: COMI أو التجاري الدولي" />
            </div>
          </div>
          <button class="btn btn-primary" (click)="showCreateStockModal = true" style="flex-shrink: 0;">+ سهم جديد</button>
          <button class="btn btn-outline" (click)="loadMgmtData()" [disabled]="mgmtLoading" style="flex-shrink: 0;">
            <lucide-icon [img]="RefreshCwIcon" size="15"></lucide-icon>
            تحديث
          </button>
        </div>

        <!-- Status message -->
        <div *ngIf="mgmtMessage" style="margin: 0 28px 16px; padding: 12px 16px; border-radius: 10px; font-size: 13px;"
             [style.background]="mgmtError ? '#fff5f5' : '#f0fdf4'"
             [style.border]="mgmtError ? '1px solid #fecaca' : '1px solid #bbf7d0'"
             [style.color]="mgmtError ? 'var(--bad)' : 'var(--good)'">{{ mgmtMessage }}</div>

        <!-- Create stock modal (inline) -->
        <div *ngIf="showCreateStockModal" style="margin: 0 28px 20px; padding: 20px; background: #f8faff; border: 1px solid var(--border); border-radius: 14px;">
          <h3 style="margin: 0 0 14px; font-size: 15px;">إنشاء سهم جديد</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
            <div>
              <label style="font-size: 11px; font-weight: 600; color: var(--muted-foreground); display: block; margin-bottom: 4px;">الرمز (Ticker) *</label>
              <input type="text" class="form-input" [(ngModel)]="newStock.ticker" placeholder="COMI" style="width: 100%; box-sizing: border-box;" />
            </div>
            <div>
              <label style="font-size: 11px; font-weight: 600; color: var(--muted-foreground); display: block; margin-bottom: 4px;">الاسم بالعربية</label>
              <input type="text" class="form-input" [(ngModel)]="newStock.nameAr" placeholder="البنك التجاري" style="width: 100%; box-sizing: border-box;" />
            </div>
            <div>
              <label style="font-size: 11px; font-weight: 600; color: var(--muted-foreground); display: block; margin-bottom: 4px;">الاسم بالإنجليزية</label>
              <input type="text" class="form-input" [(ngModel)]="newStock.nameEn" placeholder="Commercial Bank" style="width: 100%; box-sizing: border-box;" />
            </div>
            <div>
              <label style="font-size: 11px; font-weight: 600; color: var(--muted-foreground); display: block; margin-bottom: 4px;">القطاع (اختياري)</label>
              <select class="form-input" [(ngModel)]="newStock.sectorId" style="width: 100%; box-sizing: border-box;">
                <option [ngValue]="null">— بدون قطاع —</option>
                <option *ngFor="let s of mgmtSectors" [ngValue]="s.id">{{ s.nameAr }} ({{ s.nameEn }})</option>
              </select>
            </div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 14px;">
            <button class="btn btn-primary" (click)="createStock()" [disabled]="mgmtBusy">إنشاء</button>
            <button class="btn btn-outline" (click)="showCreateStockModal = false">إلغاء</button>
          </div>
        </div>

        <!-- Stocks table -->
        <div class="table-scroll-x" style="padding: 0 28px 28px;">
          <div *ngIf="mgmtLoading" class="muted" style="padding: 24px 0; text-align: center;">جارٍ التحميل...</div>
          <div *ngIf="!mgmtLoading && mgmtStocks.length === 0" class="muted" style="padding: 24px 0; text-align: center;">لا توجد نتائج. ابحث بالرمز أو الاسم أعلاه.</div>
          <table *ngIf="mgmtStocks.length > 0" class="admin-table" style="width: 100%;">
            <thead>
              <tr>
                <th>الرمز</th>
                <th>الاسم</th>
                <th>القطاع الحالي</th>
                <th>يدوي؟</th>
                <th>تعيين قطاع</th>
                <th>مؤشرات</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of mgmtStocks">
                <td><strong style="font-family: monospace;">{{ s.ticker }}</strong>
                  <span *ngIf="!s.isActive" style="font-size: 10px; background: #fee2e2; color: #b91c1c; padding: 1px 6px; border-radius: 999px; margin-right: 4px;">معطَّل</span>
                </td>
                <td style="font-size: 13px;">{{ s.nameAr || s.nameEn || '—' }}</td>
                <td style="font-size: 13px;">
                  <span *ngIf="s.sectorNameAr">{{ s.sectorNameAr }}</span>
                  <span *ngIf="!s.sectorNameAr" class="muted">—</span>
                </td>
                <td style="text-align: center;">
                  <span *ngIf="s.isManual" style="font-size: 11px; background: #ede9fe; color: #5b21b6; padding: 2px 8px; border-radius: 999px;">يدوي ✦</span>
                  <span *ngIf="!s.isManual" style="font-size: 11px; color: var(--muted-foreground);">آلي</span>
                </td>
                <td>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <select class="form-input" style="font-size: 12px; padding: 4px 8px; min-width: 140px;"
                            [(ngModel)]="mgmtPickedSector[s.id]">
                      <option [ngValue]="undefined">— اختر قطاعاً —</option>
                      <option *ngFor="let sec of mgmtSectors" [ngValue]="sec.id">{{ sec.nameAr }}</option>
                    </select>
                    <button class="btn btn-outline" style="font-size: 12px; padding: 4px 10px;"
                            (click)="assignSector(s)" [disabled]="!mgmtPickedSector[s.id] || mgmtBusy">تعيين</button>
                    <button *ngIf="s.sectorId" class="btn btn-outline" style="font-size: 12px; padding: 4px 10px; border-color: #fecaca; color: var(--bad);"
                            (click)="removeFromSector(s)" [disabled]="mgmtBusy">إزالة</button>
                  </div>
                </td>
                <td>
                  <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <select class="form-input" style="font-size: 12px; padding: 4px 8px; min-width: 130px;"
                            [(ngModel)]="mgmtPickedIndex[s.id]">
                      <option [ngValue]="undefined">— اختر مؤشراً —</option>
                      <option *ngFor="let idx of mgmtIndices" [ngValue]="idx.id">{{ idx.code }}</option>
                    </select>
                    <button class="btn btn-outline" style="font-size: 12px; padding: 4px 10px;"
                            (click)="addToIndex(s)" [disabled]="!mgmtPickedIndex[s.id] || mgmtBusy">إضافة</button>
                    <button *ngIf="mgmtPickedIndex[s.id]" class="btn btn-outline" style="font-size: 12px; padding: 4px 10px; border-color: #fecaca; color: var(--bad);"
                            (click)="removeFromIndex(s)" [disabled]="mgmtBusy">إزالة من المؤشر</button>
                  </div>
                </td>
                <td>
                  <!-- placeholder for future actions -->
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit, OnDestroy {
  readonly UploadIcon = Upload;
  readonly PlayIcon = Play;
  readonly RefreshCwIcon = RefreshCw;
  readonly DatabaseIcon = Database;
  readonly HistoryIcon = History;
  readonly SearchIcon = Search;
  readonly SaveIcon = Save;
  readonly RotateCcwIcon = RotateCcw;
  readonly LogOutIcon = LogOut;
  readonly CalendarIcon = Calendar;
  readonly ClockIcon = Clock;
  readonly Edit3Icon = Edit3;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly FileTextIcon = FileText;
  readonly UploadFileIcon = UploadIcon;
  readonly XIcon = X;
  readonly AlertCircleIcon = AlertCircle;
  readonly CheckCircleIcon = CheckCircle;
  readonly CheckIcon = Check;
  readonly ShieldCheckIcon = ShieldCheck;

  activeTab: 'scraping' | 'market-data' | 'upload' | 'shariah' | 'pdf-upload' | 'review' | 'stocks' | 'shariah-edit' = 'scraping';

  indices: IndexSummaryDto[] = [];
  allStocks: AdminStockLookupItem[] = [];
  filteredStocks: AdminStockLookupItem[] = [];
  stockSearchQuery = '';
  selectedTicker = '';

  // Market Data Editor tab
  selectedStockMarketData?: MarketDataDto;
  loadingStock = false;
  savingMarketData = false;
  saveError = '';
  saveSuccessResult?: ManualMarketDataUpdateResponse;

  marketForm: EditableMarketForm = {
    closingPrice: null,
    high: null,
    low: null,
    open: null,
    nominalValue: null,
    bookValue: null,
    eps: null,
    marketValue: null,
    peRatio: null,
    pbRatio: null,
    currency: 'EGP',
    sourceLastUpdateText: 'تعديل يدوي عبر لوحة الإدارة',
    recalculateRatios: true
  };

  // Shariah Manual Overrides
  shariahOverrides?: ShariahOverridesDto;
  shariahOverrideForm: SaveShariahOverridesRequest = {
    coreActivityCompliantOverride: null,
    categoryArOverride: null,
    categoryEnOverride: null,
    haramRevenuePercentageOverride: null,
    loansPercentageOverride: null
  };
  savingShariahOverrides = false;
  shariahOverridesError = '';
  shariahOverridesSuccess = '';

  // Bourse Halal Standards Preview — derived from SHARIAH_STANDARDS (single source of truth)
  bourseHalalStandards: Array<{
    name: string;
    revenueMax: number | null;
    debtMax: number;
    passes: boolean;
  }> = SHARIAH_STANDARDS.map(s => ({
    name: s.nameEn,
    revenueMax: s.prohibitedRevenueMax,
    debtMax: s.debtMax,
    passes: false
  }));

  /** Scholars standard labels and threshold exposed to the template. */
  readonly scholarsStandardNameAr = SCHOLARS_STANDARD_NAME_AR;
  readonly scholarsStandardNameEn = SCHOLARS_STANDARD_NAME_EN;
  readonly scholarsDebtMaxVal = scholarsDebtMax;

  // Shariah Manual Edit tab
  filteredShariahStocks: AdminStockLookupItem[] = [];
  shariahStockSearchQuery = '';
  shariahSelectedTicker = '';
  shariahSelectedStockMarketData?: MarketDataDto;
  shariahLoadingStock = false;

  // Upload tab
  selectedUploadIndex = '';
  uploadFile?: File;
  uploading = false;
  uploadResult?: UploadIndexFileResultDto;

  // Scraping tab
  scrapeStatus?: ScrapeStatusResponse;
  private pollInterval?: any;
  activeTriggerBucket?: 'LiveDaily' | 'SlowQuarterly';
  jobSettings: Record<string, boolean> = {
    LiveDaily: true,
    SlowQuarterly: true,
    ShariahRefresh: true,
    MarketSnapshots: true
  };
  jobSettingsLoading = false;
  togglingJobKey: string | null = null;

  // Shariah tab
  shariahRefreshing = false;
  shariahSeeding = false;
  refreshResult?: RefreshShariahDataResult;
  seedResult?: SeedShariahResultDto;
  seedJsonOverride = '';

  // PDF Upload tab
  selectedPdfSource: 'FaisalBank' | 'Ostoul' = 'FaisalBank';
  pdfReportDate = '';
  selectedPdfFile?: File;
  pdfUploading = false;
  pdfUploadResult?: { success: boolean; message: string; fileName?: string; storedAt?: string; uploadedAt?: string; reportDate?: string };
  pdfUploadError = '';
  sourcePdfStatuses: Record<string, SourcePdfStatusDto> = {};
  sourcePdfLoading = false;
  sourcePdfError = '';

  // Review checklist tab
  removalCandidates: RemovalCandidateDto[] = [];
  selectedTickers = new Set<string>();
  candidatesLoading = false;
  candidatesBusy = false;
  candidatesMessage = '';
  candidatesError = false;
  refreshSelectedResult?: RefreshSelectedStocksResult;

  // Stocks management tab
  mgmtSearch = '';
  mgmtStocks: import('../../models/api.models').StockManagementItem[] = [];
  mgmtSectors: import('../../models/api.models').SectorPickerItem[] = [];
  mgmtIndices: import('../../models/api.models').IndexPickerItem[] = [];
  mgmtLoading = false;
  mgmtBusy = false;
  mgmtMessage = '';
  mgmtError = false;
  mgmtPickedSector: Record<number, number | undefined> = {};
  mgmtPickedIndex: Record<number, number | undefined> = {};
  showCreateStockModal = false;
  newStock: { ticker: string; nameAr: string; nameEn: string; sectorId: number | null } =
    { ticker: '', nameAr: '', nameEn: '', sectorId: null };

  constructor(
    private api: ApiService,
    private auth: AdminAuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Each operations section is its own child route of the admin dashboard
    // shell; the route's `tab` data value selects the visible section so the
    // browser back/forward buttons work. Defaults to 'scraping' when no data.
    this.route.data.subscribe((data) => {
      const tab = data['tab'];
      if (
        tab === 'scraping' ||
        tab === 'market-data' ||
        tab === 'upload' ||
        tab === 'shariah' ||
        tab === 'pdf-upload' ||
        tab === 'review' ||
        tab === 'stocks' ||
        tab === 'shariah-edit'
      ) {
        this.activeTab = tab;
        if (tab === 'pdf-upload') {
          this.loadSourcePdfStatus();
        }
        if (tab === 'stocks') {
          this.loadMgmtData();
        }
      }
    });
    this.loadIndices();
    this.loadStocks();
    this.fetchScrapeStatus();
    this.loadJobSettings();
    this.pollInterval = setInterval(() => {
      if (this.activeTab === 'scraping' || this.isScrapingRunning) {
        this.fetchScrapeStatus();
      }
    }, 2500);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadJobSettings(): void {
    this.jobSettingsLoading = true;
    this.api.getJobSettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.jobSettings = { ...this.jobSettings, ...settings };
        }
        this.jobSettingsLoading = false;
      },
      error: () => {
        this.jobSettingsLoading = false;
      }
    });
  }

  toggleJobSetting(jobKey: string): void {
    const nextVal = !this.isJobEnabled(jobKey);
    this.togglingJobKey = jobKey;
    this.api.setJobSetting(jobKey, nextVal).subscribe({
      next: (res) => {
        this.jobSettings = { ...this.jobSettings, [res.jobKey]: res.enabled };
        this.togglingJobKey = null;
      },
      error: () => {
        this.togglingJobKey = null;
      }
    });
  }

  isJobEnabled(jobKey: string): boolean {
    return this.jobSettings[jobKey] !== false;
  }


  logout(): void {
    this.auth.logout();
  }

  get isScrapingRunning(): boolean {
    const s = this.scrapeStatus?.status;
    return s === 'Running' || s === 'Committing';
  }

  get isDailyRunning(): boolean {
    return this.isScrapingRunning && (this.activeTriggerBucket === 'LiveDaily' || (this.scrapeStatus?.live?.triggeredBy?.includes('Live') ?? false));
  }

  get isQuarterlyRunning(): boolean {
    return this.isScrapingRunning && (this.activeTriggerBucket === 'SlowQuarterly' || (this.scrapeStatus?.live?.triggeredBy?.includes('Slow') ?? false));
  }

  getBucketLastRun(bucket: 'LiveDaily' | 'SlowQuarterly'): string {
    if (!this.scrapeStatus?.lastRun) return 'لا يوجد سجل سابق';
    const last = this.scrapeStatus.lastRun;
    if (bucket === 'LiveDaily' && last.triggeredBy.includes('Live')) {
      return `${new Date(last.runAt).toLocaleString('ar-EG')}`;
    }
    if (bucket === 'SlowQuarterly' && last.triggeredBy.includes('Slow')) {
      return `${new Date(last.runAt).toLocaleString('ar-EG')}`;
    }
    return `${new Date(last.runAt).toLocaleString('ar-EG')} (${last.triggeredBy})`;
  }

  loadIndices(): void {
    this.api.getIndices().subscribe({
      next: (data) => (this.indices = data || [])
    });
  }

  loadStocks(): void {
    this.api.getAdminStocksLookup().subscribe({
      next: (stocks) => {
        this.allStocks = stocks || [];
        this.filteredStocks = [...this.allStocks];
      },
      error: () => {
        // Fallback: load all via paginated endpoint with large page size
        this.api.getStocks({ page: 1, pageSize: 500 }).subscribe({
          next: (res) => {
            this.allStocks = (res.items || []).map(s => ({
              ticker: s.ticker,
              nameAr: s.nameAr,
              nameEn: s.nameEn
            }));
            this.filteredStocks = [...this.allStocks];
          }
        });
      }
    });
  }

  onSearchInput(): void {
    const q = this.stockSearchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredStocks = [...this.allStocks];
      return;
    }
    this.filteredStocks = this.allStocks.filter(s =>
      s.ticker.toLowerCase().includes(q) ||
      (s.nameAr && s.nameAr.toLowerCase().includes(q)) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q))
    );

    // If exact ticker match typed, auto-select
    const exact = this.allStocks.find(s => s.ticker.toLowerCase() === q);
    if (exact && this.selectedTicker !== exact.ticker) {
      this.selectedTicker = exact.ticker;
      this.loadStockMarketData(exact.ticker);
    }
  }

  selectStockDirectly(ticker: string): void {
    this.selectedTicker = ticker;
    this.stockSearchQuery = ticker;
    this.loadStockMarketData(ticker);
  }

  onStockSelected(): void {
    if (!this.selectedTicker) {
      this.selectedStockMarketData = undefined;
      return;
    }
    this.stockSearchQuery = this.selectedTicker;
    this.loadStockMarketData(this.selectedTicker);
  }

  loadStockMarketData(ticker: string): void {
    this.loadingStock = true;
    this.saveError = '';
    this.saveSuccessResult = undefined;

    this.api.getMarketData(ticker).subscribe({
      next: (data) => {
        this.selectedStockMarketData = data;
        this.populateForm(data);
        this.loadingStock = false;
      },
      error: (err) => {
        if (err.status === 404) {
          // Stock exists but has no market data yet — show empty form for creation
          const match = this.allStocks.find(s => s.ticker === ticker);
          this.selectedStockMarketData = {
            ticker,
            nameAr: match?.nameAr,
            nameEn: match?.nameEn,
            indices: [],
            shariahOpinions: [],
          } as any;
          this.marketForm = {
            closingPrice: null, high: null, low: null, open: null,
            nominalValue: null, bookValue: null, eps: null, marketValue: null,
            peRatio: null, pbRatio: null, currency: 'EGP',
            sourceLastUpdateText: 'تعديل يدوي من لوحة الإدارة',
            recalculateRatios: true
          };
          this.saveError = '';
        } else {
          this.saveError = 'تعذر تحميل بيانات السهم المختار';
        }
        this.loadingStock = false;
      }
    });
  }

  loadShariahOverrides(ticker: string): void {
    this.api.getShariahOverrides(ticker).subscribe({
      next: (data) => {
        this.shariahOverrides = data;
        this.populateShariahOverrideForm(data);
        this.updateBourseHalalStandards();
      },
      error: () => {
        // Shariah overrides not found or not applicable - silently continue
        this.shariahOverrides = undefined;
      }
    });
  }

  populateShariahOverrideForm(data: ShariahOverridesDto): void {
    this.shariahOverrideForm = {
      coreActivityCompliantOverride: data.overrideCoreActivityCompliant ?? null,
      categoryArOverride: data.overrideCategoryAr ?? null,
      categoryEnOverride: data.overrideCategoryEn ?? null,
      haramRevenuePercentageOverride: data.overrideHaramRevenuePercentage ?? null,
      loansPercentageOverride: data.overrideLoansPercentage ?? null
    };
  }

  updateBourseHalalStandards(): void {
    if (!this.shariahOverrides) return;
    const rev = this.shariahOverrides.effectiveHaramRevenuePercentage ?? null;
    const debt = this.shariahOverrides.effectiveLoansPercentage ?? null;
    this.bourseHalalStandards = SHARIAH_STANDARDS.map(s => ({
      name: s.nameEn,
      revenueMax: s.prohibitedRevenueMax,
      debtMax: s.debtMax,
      passes: (rev === null || rev <= s.prohibitedRevenueMax) && (debt === null || debt <= s.debtMax) && (rev !== null || debt !== null)
    }));
  }

  // ── Shariah Manual Edit tab ────────────────────────────────────────────────

  onShariahSearchInput(): void {
    const q = this.shariahStockSearchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredShariahStocks = [...this.allStocks];
      return;
    }
    this.filteredShariahStocks = this.allStocks.filter(s =>
      s.ticker.toLowerCase().includes(q) ||
      (s.nameAr && s.nameAr.toLowerCase().includes(q)) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q))
    );

    // If exact ticker match typed, auto-select
    const exact = this.allStocks.find(s => s.ticker.toLowerCase() === q);
    if (exact && this.shariahSelectedTicker !== exact.ticker) {
      this.shariahSelectedTicker = exact.ticker;
      this.loadShariahStockMarketData(exact.ticker);
    }
  }

  selectShariahStockDirectly(ticker: string): void {
    this.shariahSelectedTicker = ticker;
    this.shariahStockSearchQuery = ticker;
    this.loadShariahStockMarketData(ticker);
  }

  onShariahStockSelected(): void {
    if (!this.shariahSelectedTicker) {
      this.shariahSelectedStockMarketData = undefined;
      return;
    }
    this.shariahStockSearchQuery = this.shariahSelectedTicker;
    this.loadShariahStockMarketData(this.shariahSelectedTicker);
  }

  loadShariahStockMarketData(ticker: string): void {
    this.shariahLoadingStock = true;
    this.shariahOverrides = undefined;
    this.shariahOverridesError = '';
    this.shariahOverridesSuccess = '';

    this.api.getMarketData(ticker).subscribe({
      next: (data) => {
        this.shariahSelectedStockMarketData = data;
        this.shariahLoadingStock = false;
        // Load Shariah overrides if the stock has Shariah metrics
        if (data.shariahMetrics) {
          this.loadShariahOverrides(ticker);
        }
      },
      error: (err) => {
        if (err.status === 404) {
          const match = this.allStocks.find(s => s.ticker === ticker);
          this.shariahSelectedStockMarketData = {
            ticker,
            nameAr: match?.nameAr,
            nameEn: match?.nameEn,
            indices: [],
            shariahOpinions: [],
          } as any;
        } else {
          this.shariahOverridesError = 'تعذر تحميل بيانات السهم المختار';
        }
        this.shariahLoadingStock = false;
      }
    });
  }

  populateForm(data: MarketDataDto): void {
    this.marketForm = {
      closingPrice: data.closingPrice ?? null,
      high: data.high ?? null,
      low: data.low ?? null,
      open: data.open ?? null,
      nominalValue: data.nominalValue ?? null,
      bookValue: data.bookValue ?? null,
      eps: data.eps ?? null,
      marketValue: data.marketValue ?? null,
      peRatio: data.peRatio ?? null,
      pbRatio: data.pbRatio ?? null,
      currency: data.currency || 'EGP',
      sourceLastUpdateText: 'تعديل يدوي من لوحة الإدارة',
      recalculateRatios: true
    };
  }

  resetMarketForm(): void {
    if (this.selectedStockMarketData) {
      this.populateForm(this.selectedStockMarketData);
      this.saveError = '';
      this.saveSuccessResult = undefined;
    }
  }

  saveMarketData(event: Event): void {
    event.preventDefault();
    if (!this.selectedStockMarketData || !this.selectedTicker) return;

    if (this.marketForm.closingPrice !== null && this.marketForm.closingPrice < 0) {
      this.saveError = 'لا يمكن أن يكون سعر الإغلاق رقماً سالباً.';
      return;
    }

    const confirmMsg = `هل أنت متأكد من حفظ التعديلات اليدوية للسهم ${this.selectedTicker}؟ سيتم تحديث القيم الحية وتجاوز أي قيم مسحوبة آلياً.`;
    if (!confirm(confirmMsg)) {
      return;
    }

    this.savingMarketData = true;
    this.saveError = '';
    this.saveSuccessResult = undefined;

    const req: ManualMarketDataUpdateRequest = {
      nominalValue: this.marketForm.nominalValue,
      marketValue: this.marketForm.marketValue,
      bookValue: this.marketForm.bookValue,
      eps: this.marketForm.eps,
      peRatio: this.marketForm.peRatio,
      pbRatio: this.marketForm.pbRatio,
      currency: this.marketForm.currency,
      high: this.marketForm.high,
      low: this.marketForm.low,
      open: this.marketForm.open,
      closingPrice: this.marketForm.closingPrice,
      sourceLastUpdateText: this.marketForm.sourceLastUpdateText,
      recalculateRatios: this.marketForm.recalculateRatios
    };

    this.api.updateMarketData(this.selectedTicker, req).subscribe({
      next: (res) => {
        this.saveSuccessResult = res;
        this.savingMarketData = false;
        // Refresh stock market data view
        this.loadStockMarketData(this.selectedTicker);
      },
      error: (err) => {
        this.saveError = err.error?.message || err.message || 'حدث خطأ أثناء حفظ بيانات السوق.';
        this.savingMarketData = false;
      }
    });
  }

  // ── Shariah Manual Overrides ────────────────────────────────────────────────

  saveShariahOverrides(): void {
    if (!this.selectedTicker) return;

    // Validate percentage ranges
    const haramRev = this.shariahOverrideForm.haramRevenuePercentageOverride;
    if (haramRev !== null && haramRev !== undefined &&
        (haramRev < 0 || haramRev > 100)) {
      this.shariahOverridesError = 'نسبة الإيراد المحرم يجب أن تكون بين 0 و 100.';
      return;
    }
    const loansPct = this.shariahOverrideForm.loansPercentageOverride;
    if (loansPct !== null && loansPct !== undefined &&
        (loansPct < 0 || loansPct > 100)) {
      this.shariahOverridesError = 'نسبة القروض والفوائد يجب أن تكون بين 0 و 100.';
      return;
    }

    this.savingShariahOverrides = true;
    this.shariahOverridesError = '';
    this.shariahOverridesSuccess = '';

    this.api.saveShariahOverrides(this.selectedTicker, this.shariahOverrideForm).subscribe({
      next: (data) => {
        this.shariahOverrides = data;
        this.populateShariahOverrideForm(data);
        this.updateBourseHalalStandards();
        this.shariahOverridesSuccess = 'تم حفظ التعديلات الشرعية بنجاح. تم إعادة احتساب حالة الامتثال.';
        this.savingShariahOverrides = false;
        // Refresh the stock market data to reflect updated compliance status
        this.loadStockMarketData(this.selectedTicker);
      },
      error: (err) => {
        this.shariahOverridesError = err.error?.message || err.message || 'حدث خطأ أثناء حفظ التعديلات الشرعية.';
        this.savingShariahOverrides = false;
      }
    });
  }

  resetShariahOverride(fieldName: string): void {
    if (!this.selectedTicker) return;

    const confirmMsg = `هل أنت متأكد من استعادة قيمة التغذية لـ ${this.getFieldLabel(fieldName)}؟ سيتم إلغاء التعديل اليدوي.`;
    if (!confirm(confirmMsg)) {
      return;
    }

    this.savingShariahOverrides = true;
    this.shariahOverridesError = '';
    this.shariahOverridesSuccess = '';

    this.api.resetShariahOverride(this.selectedTicker, fieldName).subscribe({
      next: (data) => {
        this.shariahOverrides = data;
        this.populateShariahOverrideForm(data);
        this.updateBourseHalalStandards();
        this.shariahOverridesSuccess = `تم استعادة قيمة التغذية لـ ${this.getFieldLabel(fieldName)}.`;
        this.savingShariahOverrides = false;
        // Refresh the stock market data to reflect updated compliance status
        this.loadStockMarketData(this.selectedTicker);
      },
      error: (err) => {
        this.shariahOverridesError = err.error?.message || err.message || 'حدث خطأ أثناء استعادة قيمة التغذية.';
        this.savingShariahOverrides = false;
      }
    });
  }

  private getFieldLabel(fieldName: string): string {
    switch (fieldName.toLowerCase()) {
      case 'coreactivitycompliant': return 'مطابقة النشاط الأساسي';
      case 'categoryar': return 'التصنيف (العربي)';
      case 'categoryen': return 'التصنيف (الإنجليزي)';
      case 'haramrevenuepercentage': return 'نسبة الإيراد المحرم';
      case 'loanspercentage': return 'نسبة القروض والفوائد';
      default: return fieldName;
    }
  }

  get passedStandardsCount(): number {
    return this.bourseHalalStandards?.filter(s => s.passes).length ?? 0;
  }

  triggerDailyScrape(): void {
    this.activeTriggerBucket = 'LiveDaily';
    this.api.runScraping('LiveDaily').subscribe({
      next: () => {
        this.fetchScrapeStatus();
      },
      error: (err) => {
        console.error('Failed to trigger daily scrape', err);
      }
    });
  }

  triggerQuarterlyScrape(): void {
    this.activeTriggerBucket = 'SlowQuarterly';
    this.api.runScraping('SlowQuarterly').subscribe({
      next: () => {
        this.fetchScrapeStatus();
      },
      error: (err) => {
        console.error('Failed to trigger quarterly scrape', err);
      }
    });
  }

  fetchScrapeStatus(): void {
    this.api.getScrapingStatus().subscribe({
      next: (res) => {
        this.scrapeStatus = res;
        if (!this.isScrapingRunning) {
          this.activeTriggerBucket = undefined;
        }
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.uploadFile = file;
    }
  }

  onUploadSubmit(event: Event): void {
    event.preventDefault();
    if (!this.selectedUploadIndex || !this.uploadFile) return;

    this.uploading = true;
    this.uploadResult = undefined;

    this.api.uploadIndexFile(this.selectedUploadIndex, this.uploadFile).subscribe({
      next: (res) => {
        this.uploadResult = res;
        this.uploading = false;
        this.loadIndices();
      },
      error: (err) => {
        this.uploadResult = {
          indexCode: this.selectedUploadIndex,
          inserted: 0,
          updated: 0,
          skipped: 0,
          totalConstituents: 0,
          skippedDetails: [],
          status: 'Failed',
          message: err.error?.message || err.message || 'حدث خطأ أثناء معالجة ملف الإكسيل.'
        };
        this.uploading = false;
      }
    });
  }

  triggerShariahRefresh(): void {
    this.shariahRefreshing = true;
    this.refreshResult = undefined;
    this.api.refreshShariah().subscribe({
      next: (res) => {
        this.refreshResult = res;
        this.shariahRefreshing = false;
      },
      error: () => {
        this.shariahRefreshing = false;
      }
    });
  }

  triggerShariahSeed(): void {
    this.shariahSeeding = true;
    this.seedResult = undefined;
    let payload: any = null;
    if (this.seedJsonOverride.trim()) {
      try {
        payload = JSON.parse(this.seedJsonOverride);
      } catch (e) {
        alert('صيغة JSON غير صحيحة');
        this.shariahSeeding = false;
        return;
      }
    }

    this.api.seedShariah(payload).subscribe({
      next: (res) => {
        this.seedResult = res;
        this.shariahSeeding = false;
      },
      error: () => {
        this.shariahSeeding = false;
      }
    });
  }

  // ── PDF Upload tab ────────────────────────────────────────────────
  onPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('الملف يجب أن يكون بصيغة PDF');
        this.selectedPdfFile = undefined;
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('حجم الملف يتجاوز 50 ميجابايت');
        this.selectedPdfFile = undefined;
        return;
      }
      this.selectedPdfFile = file;
      this.pdfUploadError = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' بايت';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' كيلوبايت';
    return (bytes / (1024 * 1024)).toFixed(1) + ' ميجابايت';
  }

  uploadPdfReport(): void {
    if (!this.selectedPdfFile) {
      this.pdfUploadError = 'الرجاء اختيار ملف PDF أولاً';
      return;
    }

    this.pdfUploading = true;
    this.pdfUploadError = '';
    this.pdfUploadResult = undefined;

    this.api.uploadSourcePdf(this.selectedPdfSource, this.selectedPdfFile, this.pdfReportDate || undefined).subscribe({
      next: (data) => {
        if (data.success) {
          this.pdfUploadResult = {
            success: true,
            message: data.message || '',
            fileName: data.fileName || undefined,
            storedAt: data.storedAt || undefined,
            uploadedAt: data.uploadedAt || undefined,
            reportDate: data.reportDate || undefined
          };
          this.pdfUploadError = '';
          this.selectedPdfFile = undefined;
          // Refresh stored-files status immediately (no stale cache).
          this.loadSourcePdfStatus();
        } else {
          this.pdfUploadError = data.message || 'فشل رفع الملف';
          this.pdfUploadResult = {
            success: false,
            message: data.message || 'فشل رفع الملف'
          };
        }
        this.pdfUploading = false;
      },
      error: (e) => {
        this.pdfUploadError = 'خطأ في الاتصال بالخادم: ' + (e?.message || e);
        this.pdfUploadResult = {
          success: false,
          message: 'خطأ في الاتصال بالخادم'
        };
        this.pdfUploading = false;
      }
    });
  }

  /**
   * Loads the stored-files status from the API (database record + file on
   * disk, per source). Never defaults to "not found": loading and error states
   * are surfaced explicitly in the template.
   */
  loadSourcePdfStatus(): void {
    this.sourcePdfLoading = true;
    this.sourcePdfError = '';
    this.api.getSourcePdfStatus().subscribe({
      next: (rows) => {
        const map: Record<string, SourcePdfStatusDto> = {};
        for (const row of rows || []) {
          if (row?.sourceKey) map[row.sourceKey] = row;
        }
        this.sourcePdfStatuses = map;
        this.sourcePdfLoading = false;
      },
      error: () => {
        this.sourcePdfLoading = false;
        this.sourcePdfError = 'تعذّر تحميل حالة الملفات المخزنة.';
      }
    });
  }

  getSourcePdfState(sourceKey: string): SourcePdfStatusDto | null {
    return this.sourcePdfStatuses[sourceKey] ?? null;
  }

  getSourcePdfViewUrl(sourceKey: string): string {
    return this.api.getSourcePdfUrl(sourceKey);
  }

  formatPdfDate(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  }

  // ── Review checklist tab ───────────────────────────────────────────
  openReviewTab(): void {
    this.activeTab = 'review';
    if (this.removalCandidates.length === 0) this.loadRemovalCandidates();
  }

  loadRemovalCandidates(): void {
    this.candidatesLoading = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.api.getRemovalCandidates().subscribe({
      next: (rows) => {
        this.removalCandidates = rows || [];
        // Drop selections for tickers that are no longer candidates.
        this.selectedTickers = new Set(
          [...this.selectedTickers].filter((t) => this.removalCandidates.some((c) => c.ticker === t))
        );
        this.candidatesLoading = false;
      },
      error: () => {
        this.candidatesLoading = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر تحميل قائمة المراجعة.';
      }
    });
  }

  toggleCandidate(ticker: string, checked: boolean): void {
    if (checked) this.selectedTickers.add(ticker);
    else this.selectedTickers.delete(ticker);
    this.selectedTickers = new Set(this.selectedTickers);
  }

  get allCandidatesSelected(): boolean {
    return this.removalCandidates.length > 0 && this.selectedTickers.size === this.removalCandidates.length;
  }

  toggleSelectAllCandidates(checked: boolean): void {
    this.selectedTickers = checked
      ? new Set(this.removalCandidates.map((c) => c.ticker))
      : new Set<string>();
  }

  refreshSelectedCandidates(): void {
    const tickers = [...this.selectedTickers];
    if (!tickers.length) return;
    this.candidatesBusy = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.refreshSelectedResult = undefined;
    this.api.refreshSelectedStocks(tickers).subscribe({
      next: (res) => {
        this.candidatesBusy = false;
        this.refreshSelectedResult = res;
        this.candidatesError = !res.success;
        this.candidatesMessage = `اكتملت إعادة السحب: نجح ${res.succeeded} وفشل ${res.failed} من ${res.totalRequested}.`
          + (res.errorSummary ? ` — ${res.errorSummary}` : '');
        this.loadRemovalCandidates();
      },
      error: () => {
        this.candidatesBusy = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر تنفيذ إعادة السحب للأسهم المحددة.';
      }
    });
  }

  confirmSelectedCandidates(): void {
    const tickers = [...this.selectedTickers];
    if (!tickers.length) return;
    if (!confirm(`تأكيد إيقاف ${tickers.length} سهم؟ (يتم الإيقاف فقط مع الاحتفاظ بالبيانات)`)) return;
    this.candidatesBusy = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.api.confirmRemovals(tickers, 'تم الإيقاف يدوياً عبر قائمة المراجعة').subscribe({
      next: (res) => {
        this.candidatesBusy = false;
        this.candidatesMessage = res.message;
        this.selectedTickers = new Set<string>();
        this.loadRemovalCandidates();
      },
      error: () => {
        this.candidatesBusy = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر تأكيد الإيقاف.';
      }
    });
  }

  reactivateSelectedCandidates(): void {
    const tickers = [...this.selectedTickers];
    if (!tickers.length) return;
    this.candidatesBusy = true;
    this.candidatesMessage = '';
    this.candidatesError = false;
    this.api.reactivateSelectedStocks(tickers).subscribe({
      next: (res) => {
        this.candidatesBusy = false;
        this.candidatesMessage = res.message;
        this.selectedTickers = new Set<string>();
        this.loadRemovalCandidates();
      },
      error: () => {
        this.candidatesBusy = false;
        this.candidatesError = true;
        this.candidatesMessage = 'تعذّر إعادة التفعيل.';
      }
    });
  }

  reasonLabel(reason: string): string {
    switch (reason) {
      case 'StaleData': return 'بيانات قديمة';
      case 'NotFoundOnSource': return 'غير موجود في المصدر';
      case 'Deactivated': return 'معطَّل يدوياً';
      default: return reason;
    }
  }

  // ── Stocks management ──────────────────────────────
  loadMgmtData(): void {
    this.mgmtLoading = true;
    this.mgmtMessage = '';
    this.api.getManagementSectors().subscribe({
      next: (s) => (this.mgmtSectors = s || []),
      error: () => {}
    });
    this.api.getManagementIndices().subscribe({
      next: (i) => (this.mgmtIndices = i || []),
      error: () => {}
    });
    this.api.searchStocksForManagement(this.mgmtSearch ? this.mgmtSearch.trim() : undefined).subscribe({
      next: (stocks) => {
        this.mgmtStocks = stocks || [];
        this.mgmtLoading = false;
      },
      error: () => {
        this.mgmtLoading = false;
        this.mgmtError = true;
        this.mgmtMessage = 'تعذّر تحميل الأسهم.';
      }
    });
  }

  onMgmtSearchChange(q: string): void {
    this.mgmtSearch = q;
    this.loadMgmtData();
  }

  createStock(): void {
    if (!this.newStock.ticker.trim()) {
      this.mgmtError = true;
      this.mgmtMessage = 'يرجى إدخال رمز السهم (Ticker).';
      return;
    }
    this.mgmtBusy = true;
    this.mgmtMessage = '';
    this.api.createManagedStock({
      ticker: this.newStock.ticker.trim(),
      nameAr: this.newStock.nameAr?.trim() || null,
      nameEn: this.newStock.nameEn?.trim() || null,
      sectorId: this.newStock.sectorId
    }).subscribe({
      next: (s) => {
        this.mgmtBusy = false;
        this.mgmtError = false;
        this.mgmtMessage = `تم إنشاء سهم ${s.ticker} بنجاح.`;
        this.showCreateStockModal = false;
        this.newStock = { ticker: '', nameAr: '', nameEn: '', sectorId: null };
        this.loadMgmtData();
      },
      error: (e) => {
        this.mgmtBusy = false;
        this.mgmtError = true;
        this.mgmtMessage = e?.error?.message || e?.error?.title || 'تعذّر إنشاء السهم.';
      }
    });
  }

  assignSector(s: StockManagementItem): void {
    const sectorId = this.mgmtPickedSector[s.id];
    if (!sectorId) return;
    this.mgmtBusy = true;
    this.mgmtMessage = '';
    this.api.assignStockSector(s.id, sectorId).subscribe({
      next: (updated) => {
        this.mgmtBusy = false;
        this.mgmtError = false;
        this.mgmtMessage = `تم تعيين ${updated.ticker} إلى قطاع ${updated.sectorNameAr || ''}.`;
        const idx = this.mgmtStocks.findIndex((x) => x.id === s.id);
        if (idx >= 0) this.mgmtStocks[idx] = updated;
      },
      error: (e) => {
        this.mgmtBusy = false;
        this.mgmtError = true;
        this.mgmtMessage = e?.error?.message || 'تعذّر تعيين القطاع.';
      }
    });
  }

  removeFromSector(s: StockManagementItem): void {
    if (!confirm(`هل أنت متأكد من إزالة السهم ${s.ticker} من قطاعه الحالي؟`)) return;
    this.mgmtBusy = true;
    this.mgmtMessage = '';
    this.api.removeStockFromSector(s.id).subscribe({
      next: (updated) => {
        this.mgmtBusy = false;
        this.mgmtError = false;
        this.mgmtMessage = `تمت إزالة ${updated.ticker} من قطاعه.`;
        const idx = this.mgmtStocks.findIndex((x) => x.id === s.id);
        if (idx >= 0) this.mgmtStocks[idx] = updated;
      },
      error: (e) => {
        this.mgmtBusy = false;
        this.mgmtError = true;
        this.mgmtMessage = e?.error?.message || 'تعذّر إزالة السهم من القطاع.';
      }
    });
  }

  addToIndex(s: StockManagementItem): void {
    const indexId = this.mgmtPickedIndex[s.id];
    if (!indexId) return;
    this.mgmtBusy = true;
    this.mgmtMessage = '';
    this.api.addStockToIndex(s.id, indexId).subscribe({
      next: (c) => {
        this.mgmtBusy = false;
        this.mgmtError = false;
        this.mgmtMessage = `تمت إضافة ${s.ticker} إلى مؤشر ${c.indexCode}.`;
      },
      error: (e) => {
        this.mgmtBusy = false;
        this.mgmtError = true;
        this.mgmtMessage = e?.error?.message || 'تعذّر إضافة السهم للمؤشر.';
      }
    });
  }

  removeFromIndex(s: StockManagementItem): void {
    const indexId = this.mgmtPickedIndex[s.id];
    if (!indexId) return;
    const idx = this.mgmtIndices.find((i) => i.id === indexId);
    if (!confirm(`هل أنت متأكد من إزالة السهم ${s.ticker} من مؤشر ${idx?.code || indexId}؟`)) return;
    this.mgmtBusy = true;
    this.mgmtMessage = '';
    this.api.removeStockFromIndex(s.id, indexId).subscribe({
      next: () => {
        this.mgmtBusy = false;
        this.mgmtError = false;
        this.mgmtMessage = `تمت إزالة ${s.ticker} من المؤشر.`;
        this.mgmtPickedIndex[s.id] = undefined;
      },
      error: (e) => {
        this.mgmtBusy = false;
        this.mgmtError = true;
        this.mgmtMessage = e?.error?.message || 'تعذّر إزالة السهم من المؤشر.';
      }
    });
  }
}

