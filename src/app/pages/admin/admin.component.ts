import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  Edit3
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
  StockListItemDto,
  UploadIndexFileResultDto
} from '../../models/api.models';

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
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="eyebrow"><lucide-icon [img]="DatabaseIcon" size="15"></lucide-icon> العمليات وإدارة البيانات</span>
            <h1>بوابة إدارة عمليات ميزان EGX</h1>
            <p>إدارة كشوف المؤشرات، التحكم بمهام السحب اليومية والربع سنوية، وتعديل بيانات السوق يدوياً.</p>
          </div>
          <div>
            <button class="btn btn-outline" (click)="logout()" style="color: var(--bad); border-color: var(--border);">
              <lucide-icon [img]="LogOutIcon" size="15"></lucide-icon>
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="admin-tabs">
        <button class="admin-tab" [class.active]="activeTab === 'scraping'" (click)="activeTab = 'scraping'">
          سحب بيانات السوق (Live & Quarterly)
        </button>
        <button class="admin-tab" [class.active]="activeTab === 'market-data'" (click)="activeTab = 'market-data'">
          تعديل بيانات السوق يدوياً
        </button>
        <button class="admin-tab" [class.active]="activeTab === 'upload'" (click)="activeTab = 'upload'">
          رفع كشوف المؤشرات (Excel)
        </button>
        <button class="admin-tab" [class.active]="activeTab === 'shariah'" (click)="activeTab = 'shariah'">
          تحديث الشريعة والبيانات المدمجة
        </button>
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
            </div>

            <button class="btn btn-outline" (click)="triggerQuarterlyScrape()" [disabled]="isScrapingRunning" style="width: 100%; justify-content: center; border-color: #93c5fd; color: #1d4ed8;">
              <lucide-icon [img]="PlayIcon" size="16"></lucide-icon>
              {{ isQuarterlyRunning ? 'جارٍ السحب الربع سنوي...' : 'تشغيل السحب الربع سنوي الآن (Run Quarterly)' }}
            </button>
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
                  ({{ selectedStockMarketData.priceComparison === 'Cheap' ? 'أرخص من العادلة' : (selectedStockMarketData.priceComparison === 'Expensive' ? 'أعلى من العادلة' : 'قريبة من العادلة') }})
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
          <div style="display: flex; gap: 20px; margin-top: 10px;">
            <span>الأسهم المضافة: <strong>{{ uploadResult.inserted }}</strong></span>
            <span>الأسهم المحدثة: <strong>{{ uploadResult.updated }}</strong></span>
            <span>الأسهم المتخطاة: <strong>{{ uploadResult.skipped }}</strong></span>
            <span>إجمالي المكونات: <strong>{{ uploadResult.totalConstituents }}</strong></span>
          </div>

          <div *ngIf="uploadResult.skippedDetails && uploadResult.skippedDetails.length" style="margin-top: 14px;">
            <strong>تفاصيل الصفوف المستبعدة:</strong>
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

  activeTab: 'scraping' | 'market-data' | 'upload' | 'shariah' = 'scraping';

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

  // Upload tab
  selectedUploadIndex = '';
  uploadFile?: File;
  uploading = false;
  uploadResult?: UploadIndexFileResultDto;

  // Scraping tab
  scrapeStatus?: ScrapeStatusResponse;
  private pollInterval?: any;
  activeTriggerBucket?: 'LiveDaily' | 'SlowQuarterly';

  // Shariah tab
  shariahRefreshing = false;
  shariahSeeding = false;
  refreshResult?: RefreshShariahDataResult;
  seedResult?: SeedShariahResultDto;
  seedJsonOverride = '';

  constructor(
    private api: ApiService,
    private auth: AdminAuthService
  ) {}

  ngOnInit(): void {
    this.loadIndices();
    this.loadStocks();
    this.fetchScrapeStatus();
    this.pollInterval = setInterval(() => {
      if (this.activeTab === 'scraping' || this.isScrapingRunning) {
        this.fetchScrapeStatus();
      }
    }, 2500);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
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
}
