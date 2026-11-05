import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { MarketDataDto, AdminStockLookupItem, ShariahOverridesDto, SaveShariahOverridesRequest } from '../../../shared/models/api.models';
import { SHARIAH_STANDARDS, scholarsDebtMax, SCHOLARS_STANDARD_NAME_AR, SCHOLARS_STANDARD_NAME_EN, evaluateStandards, resolveVerdictWithScholars, isViaScholarsOnly } from '../../../shared/models/shariah-standards';
import { AdminStockLookupService } from './admin-stock-lookup.service';

@Injectable({ providedIn: 'root' })
export class AdminShariahOverridesService {
  constructor(
    private api: ApiService,
    private lookup: AdminStockLookupService
  ) {
    this.lookup.onStocksLoaded(() => {
      if (!this.shariahStockSearchQuery.trim()) {
        this.filteredShariahStocks = [...this.lookup.allStocks];
      }
    });
  }

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
    
    // Set the checkbox to show the effective value initially
    // The checkbox will write to the override field when toggled
    this._coreActivityCheckboxValue = data.effectiveCoreActivityCompliant ?? false;
  }

  // Helper for the checkbox: shows effective value, writes override on change
  private _coreActivityCheckboxValue = false;

  get coreActivityCheckboxValue(): boolean {
    return this._coreActivityCheckboxValue;
  }

  set coreActivityCheckboxValue(val: boolean) {
    this._coreActivityCheckboxValue = val;
    // When user toggles, write to the override field
    this.shariahOverrideForm.coreActivityCompliantOverride = val;
  }

  adminEvaluation?: ReturnType<typeof evaluateStandards>;

  adminIsViaScholarsOnly = false;

  adminOverallVerdict: string | null = null;

  updateBourseHalalStandards(): void {
    if (!this.shariahOverrides) return;
    const rev = this.shariahOverrides.effectiveHaramRevenuePercentage ?? null;
    const debt = this.shariahOverrides.effectiveLoansPercentage ?? null;
    this.adminEvaluation = evaluateStandards({
      prohibitedRevenue: rev,
      debt: debt
    });
    this.bourseHalalStandards = this.adminEvaluation.standards.map(s => ({
      name: s.standard.nameEn,
      revenueMax: s.standard.prohibitedRevenueMax,
      debtMax: s.standard.debtMax,
      passes: s.passed
    }));
    this.adminIsViaScholarsOnly = isViaScholarsOnly(this.adminEvaluation, debt);
    this.adminOverallVerdict = resolveVerdictWithScholars(this.adminEvaluation, debt);
  }

  onShariahSearchInput(): void {
    const q = this.shariahStockSearchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredShariahStocks = [...this.lookup.allStocks];
      return;
    }
    this.filteredShariahStocks = this.lookup.allStocks.filter(s =>
      s.ticker.toLowerCase().includes(q) ||
      (s.nameAr && s.nameAr.toLowerCase().includes(q)) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q))
    );

    // If exact ticker match typed, auto-select
    const exact = this.lookup.allStocks.find(s => s.ticker.toLowerCase() === q);
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
        this.loadShariahOverrides(ticker);
      },
      error: (err) => {
        if (err.status === 404) {
          const match = this.lookup.allStocks.find(s => s.ticker === ticker);
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

  saveShariahOverrides(): void {
    if (!this.shariahSelectedTicker) return;

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

    const ticker = this.shariahSelectedTicker;
    this.api.saveShariahOverrides(ticker, this.shariahOverrideForm).subscribe({
      next: (data) => {
        this.shariahOverrides = data;
        this.populateShariahOverrideForm(data);
        this.updateBourseHalalStandards();
        this.shariahOverridesSuccess = 'تم حفظ التعديلات الشرعية بنجاح. تم إعادة احتساب حالة الامتثال.';
        this.savingShariahOverrides = false;
        // Refresh the stock market data to reflect updated compliance status
        this.loadShariahStockMarketData(ticker);
      },
      error: (err) => {
        // Clean Arabic error: prefer server-provided message, fallback to generic
        const serverMsg = err.error?.message || err.error?.title || '';
        this.shariahOverridesError = serverMsg
          ? `فشل الحفظ: ${serverMsg}`
          : 'حدث خطأ أثناء حفظ التعديلات الشرعية. يرجى المحاولة مرة أخرى.';
        this.savingShariahOverrides = false;
      }
    });
  }

  resetShariahOverride(fieldName: string): void {
    if (!this.shariahSelectedTicker) return;

    const confirmMsg = `هل أنت متأكد من استعادة قيمة التغذية لـ ${this.getFieldLabel(fieldName)}؟ سيتم إلغاء التعديل اليدوي.`;
    if (!confirm(confirmMsg)) {
      return;
    }

    this.savingShariahOverrides = true;
    this.shariahOverridesError = '';
    this.shariahOverridesSuccess = '';

    const ticker = this.shariahSelectedTicker;
    this.api.resetShariahOverride(ticker, fieldName).subscribe({
      next: (data) => {
        this.shariahOverrides = data;
        this.populateShariahOverrideForm(data);
        this.updateBourseHalalStandards();
        this.shariahOverridesSuccess = `تم استعادة قيمة التغذية لـ ${this.getFieldLabel(fieldName)}.`;
        this.savingShariahOverrides = false;
        // Refresh the stock market data to reflect updated compliance status
        this.loadShariahStockMarketData(ticker);
      },
      error: (err) => {
        // Clean Arabic error: prefer server-provided message, fallback to generic
        const serverMsg = err.error?.message || err.error?.title || '';
        this.shariahOverridesError = serverMsg
          ? `فشل الاستعادة: ${serverMsg}`
          : 'حدث خطأ أثناء استعادة قيمة التغذية. يرجى المحاولة مرة أخرى.';
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
}
