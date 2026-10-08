import { Component, ElementRef, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, PieChart, Layers, ArrowLeftRight, Download, Copy, RotateCcw, Plus, Trash2, UploadCloud, Info } from 'lucide-angular';

declare global {
  interface Window {
    initPortfolioEngine?: () => void;
    _portfolioEngineInitialized?: boolean;
    XLSX?: any;
    ExcelJS?: any;
  }
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="portfolio-page">
      <!-- Page Header -->
      <div class="page-intro">
        <div class="intro-main">
          <span class="eyebrow">أدوات الاستثمار المحترفة · Meezan Tools</span>
          <div class="title-row">
            <h1>تكوين محفظة استثمارية</h1>
            <div class="intro-note">
              <lucide-icon [img]="PieChartIcon" size="17"></lucide-icon>
              <span>تحليل كمي وأكاديمي متقدم</span>
            </div>
          </div>
          <p>
            أداة محاكاة وبناء المحفظة الاستثمارية المثلى بالاعتماد على بيانات الأسعار التاريخية، بنموذجي مؤشر السوق المنفرد (Single Index Model) والارتباط الثابت (Constant Correlation Model).
          </p>
        </div>
      </div>

      <!-- Main Container -->
      <div class="portfolio-container">
        <!-- Sub-tabs Navigation -->
        <div class="portfolio-subtabs" role="tablist">
          <button id="tabBtnPf" class="subtab-btn active" type="button" role="tab">
            <lucide-icon [img]="PieChartIcon" size="18"></lucide-icon>
            <span>أفضل أسهم للمحفظة</span>
          </button>
          <button id="tabBtnSec" class="subtab-btn" type="button" role="tab">
            <lucide-icon [img]="LayersIcon" size="18"></lucide-icon>
            <span>اختيار الأفضل لكل قطاع</span>
          </button>
        </div>

        <!-- Tab 1: Portfolio -->
        <div id="tab-portfolio" class="tabpage active">
          <section class="card detail-card" id="pfCard">
            <div class="card-heading">
              <div>
                <span class="eyebrow">المحفظة المثلى</span>
                <h2 id="t-pfTitle">أفضل أسهم للمحفظة</h2>
              </div>
            </div>

            <!-- Step 1: Inputs -->
            <div id="pf-step1">
              <div class="dropzone-grid">
                <div class="dropzone" id="pfDropStocks">
                  <div class="dropzone-icon">
                    <lucide-icon [img]="UploadCloudIcon" size="32"></lucide-icon>
                  </div>
                  <p id="t-pfDzS">اسحب ملفات الأسهم هنا (ملف لكل شركة)، أو</p>
                  <button class="primary" type="button" id="pfBtnStocks">
                    <span id="t-pfUpS">اختر ملفات الأسهم</span>
                  </button>
                  <input type="file" id="pfFileStocks" accept=".csv,.xlsx,.xls" style="display:none" multiple>
                </div>

                <div class="dropzone" id="pfDropIndex">
                  <div class="dropzone-icon">
                    <lucide-icon [img]="UploadCloudIcon" size="32"></lucide-icon>
                  </div>
                  <p id="t-pfDzI">اسحب ملف مؤشر السوق هنا، أو</p>
                  <button class="ghost" type="button" id="pfBtnIndex">
                    <span id="t-pfUpI">اختر ملف المؤشر</span>
                  </button>
                  <input type="file" id="pfFileIndex" accept=".csv,.xlsx,.xls" style="display:none">
                </div>
              </div>

              <div class="pfchips" id="pfChips"></div>

              <div class="inputsrow">
                <span class="field">
                  <label id="t-pfRf" for="pfRf">معدل العائد الخالي من المخاطر (% سنوياً):</label>
                  <input class="rfinput" type="number" id="pfRf" step="any" placeholder="مثال: 25">
                </span>
              </div>
              <div class="hint" id="t-pfRfHint">مثال: عائد أذون الخزانة المصرية لأجل 91 يوماً</div>

              <div class="winline" id="pfWinLine"></div>
              <div id="pfMsg"></div>

              <div class="btnrow action-row">
                <button id="pfGo" class="primary bigbtn" type="button" disabled>
                  <lucide-icon [img]="PieChartIcon" size="20"></lucide-icon>
                  <span id="t-pfGo">تكوين المحفظة</span>
                </button>
              </div>
            </div>

            <!-- Step 2: Results -->
            <div id="pf-step2" hidden>
              <div class="results-header-box">
                <p class="sent" id="pfSumLine" style="margin:0"></p>
              </div>

              <div class="twocol">
                <!-- Single Index Model -->
                <div class="simcol" id="pfSimCol">
                  <div class="model-badge-header">
                    <h3 id="pfSimHead">نموذج مؤشر السوق (Single Index Model)</h3>
                  </div>
                  <div id="pfSimHeadline" class="sent"></div>
                  <div class="tablewrap" id="pfSimWrap" hidden>
                    <table id="pfTable" style="min-width:0">
                      <thead>
                        <tr>
                          <th id="t-pfThS">السهم</th>
                          <th class="numh" id="t-pfThW">الوزن النسبي (%)</th>
                          <th id="t-pfThB"></th>
                        </tr>
                      </thead>
                      <tbody id="pfTBody"></tbody>
                    </table>
                  </div>
                  <div class="statgrid" id="pfBig"></div>
                  <div class="hint" id="pfSimNote"></div>
                </div>

                <!-- Constant Correlation Model -->
                <div class="ccmcol" id="pfCcmCol">
                  <div class="model-badge-header">
                    <h3>نموذج الارتباط الثابت (Constant Correlation Model)</h3>
                  </div>
                  <div id="pfCcmHeadline" class="sent"></div>
                  <div class="tablewrap" id="pfCcmWrap" hidden>
                    <table id="pfCcmTable" style="min-width:0">
                      <thead>
                        <tr>
                          <th>السهم</th>
                          <th class="numh">الوزن النسبي (%)</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody id="pfCcmBody"></tbody>
                    </table>
                  </div>
                  <div class="statgrid" id="pfCcmBig"></div>
                  <div class="hint" id="pfCcmNote"></div>
                </div>
              </div>

              <!-- Merged Weights Table -->
              <div class="merged-section">
                <h3 class="sub">مقارنة الأوزان بين النموذجين</h3>
                <div class="tablewrap" id="pfMergeWrap" hidden>
                  <table id="pfMergeTable" style="min-width:0">
                    <thead>
                      <tr>
                        <th>السهم</th>
                        <th class="numh">Single Index Model (%)</th>
                        <th class="numh">Constant Correlation Model (%)</th>
                      </tr>
                    </thead>
                    <tbody id="pfMergeBody"></tbody>
                  </table>
                </div>
              </div>

              <h2 id="pfHead" style="margin:0;display:none"></h2>

              <details class="coll" id="pfRejBox">
                <summary id="t-pfNotSel">الأسهم المستبعدة من المحفظة</summary>
                <ul class="mutedlist" id="pfRej"></ul>
              </details>

              <!-- Result Actions -->
              <div class="btnrow export-row">
                <button id="pfDl" class="ghost" type="button">
                  <lucide-icon [img]="DownloadIcon" size="16"></lucide-icon>
                  <span id="t-pfDl">تحميل Excel</span>
                </button>
                <button id="pfXlsx" class="ghost" type="button">
                  <lucide-icon [img]="DownloadIcon" size="16"></lucide-icon>
                  <span id="t-pfXlsx">تصدير Excel منسق</span>
                </button>
                <button id="pfCopy" class="ghost" type="button">
                  <lucide-icon [img]="CopyIcon" size="16"></lucide-icon>
                  <span id="t-pfCopy">نسخ النتائج</span>
                </button>
                <button id="pfStart" class="danger" type="button">
                  <lucide-icon [img]="RotateCcwIcon" size="16"></lucide-icon>
                  <span id="t-pfStart">البدء من جديد</span>
                </button>
              </div>

              <div class="btnrow secondary-actions">
                <button class="linklike" type="button" id="pfEdit">
                  <span id="t-pfEdit">تعديل المدخلات والبيانات</span>
                </button>
              </div>

              <div class="hint disclaimer-hint" id="t-pfFoot">
                تحليل كمي تاريخي لأغراض دراسية وبحثية، ولا يمثل توصية مباشرة بالبيع أو الشراء.
              </div>
            </div>
          </section>
        </div>

        <!-- Tab 2: Sectors -->
        <div id="tab-sectors" class="tabpage">
          <section class="card detail-card" id="secCard">
            <div class="card-heading">
              <div>
                <span class="eyebrow">مقارنة القطاعات</span>
                <h2 id="t-secTitle">اختيار الأفضل لكل قطاع</h2>
              </div>
            </div>

            <!-- Optional Index File -->
            <div class="dropzone" id="secDropIndex">
              <div class="dropzone-icon">
                <lucide-icon [img]="UploadCloudIcon" size="32"></lucide-icon>
              </div>
              <p id="t-secDzI">اسحب ملف مؤشر السوق هنا، أو</p>
              <button class="ghost" type="button" id="secBtnIndex">
                <span id="t-secUpI">اختر ملف المؤشر</span>
              </button>
              <input type="file" id="secFileIndex" accept=".csv,.xlsx,.xls" style="display:none">
            </div>
            <div class="pfchips" id="secIdxChip"></div>
            <div class="hint" id="t-secIdxOpt">ملف المؤشر اختياري (مطلوب لحساب نموذج مؤشر السوق SIM)</div>

            <div class="inputsrow">
              <span class="field">
                <label id="t-secRf" for="secRf">معدل العائد الخالي من المخاطر (% سنوياً):</label>
                <input class="rfinput" type="number" id="secRf" step="any" placeholder="مثال: 25">
              </span>
            </div>
            <div class="hint" id="t-secRfHint">مثال: عائد أذون الخزانة المصرية لأجل 91 يوماً</div>

            <div class="sectors-section-title">
              <h3 class="sub" id="t-secArea">القطاعات وأسهمها المرشحة</h3>
            </div>

            <!-- Dynamic Sectors List -->
            <div id="secList"></div>

            <div class="btnrow add-sector-row">
              <button id="secAdd" class="ghost" type="button">
                <lucide-icon [img]="PlusIcon" size="16"></lucide-icon>
                <span id="t-secAdd">إضافة قطاع جديد</span>
              </button>
            </div>

            <div id="secMsg"></div>

            <div class="btnrow action-row">
              <button id="secGo" class="primary bigbtn" type="button" disabled>
                <lucide-icon [img]="LayersIcon" size="20"></lucide-icon>
                <span id="t-secGo">تحديد السهم الأفضل في كل قطاع</span>
              </button>
            </div>

            <!-- Sectors Results Output -->
            <div id="secOut"></div>

            <div class="notebox" id="t-secNote">
              يتم مقارنة كل قطاع وفقاً لتواريخ التداول المشتركة الخاصة بأسهمه، ولذا قد يُختار الفائز في كل قطاع بناءً على فترة تاريخية مختلفة.
            </div>

            <div class="btnrow export-row">
              <button id="secDl" class="ghost" type="button" disabled>
                <lucide-icon [img]="DownloadIcon" size="16"></lucide-icon>
                <span id="t-secDl">تحميل Excel</span>
              </button>
              <button id="secCopy" class="ghost" type="button" disabled>
                <lucide-icon [img]="CopyIcon" size="16"></lucide-icon>
                <span id="t-secCopy">نسخ الجدول</span>
              </button>
              <button id="secSend" class="primary" type="button" disabled>
                <lucide-icon [img]="ArrowLeftRightIcon" size="16"></lucide-icon>
                <span id="t-secSend">إرسال الفائزين إلى تبويب المحفظة</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      <!-- Hidden Global Stubs for legacy references if any -->
      <div id="toast"></div>
    </div>
  `,
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit, OnDestroy {
  readonly PieChartIcon = PieChart;
  readonly LayersIcon = Layers;
  readonly ArrowLeftRightIcon = ArrowLeftRight;
  readonly DownloadIcon = Download;
  readonly CopyIcon = Copy;
  readonly RotateCcwIcon = RotateCcw;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly UploadCloudIcon = UploadCloud;
  readonly InfoIcon = Info;

  private scriptsLoaded = false;

  constructor(private host: ElementRef) {}

  ngOnInit(): void {
    this.loadRequiredScripts();
  }

  ngOnDestroy(): void {
    // cleanup if needed
  }

  private loadRequiredScripts(): void {
    this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')
      .then(() => this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js'))
      .then(() => this.loadScript('/portfolio-engine.js'))
      .then(() => {
        this.scriptsLoaded = true;
        if (typeof window.initPortfolioEngine === 'function') {
          window.initPortfolioEngine();
        }
      })
      .catch((err) => {
        console.error('Failed to load portfolio calculation scripts:', err);
      });
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  }
}
