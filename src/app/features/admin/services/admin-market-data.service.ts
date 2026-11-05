import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { MarketDataDto, ManualMarketDataUpdateRequest, ManualMarketDataUpdateResponse, AdminStockLookupItem } from '../../../shared/models/api.models';
import { AdminStockLookupService } from './admin-stock-lookup.service';
import { EditableMarketForm } from '../models/editable-market-form.model';

@Injectable({ providedIn: 'root' })
export class AdminMarketDataService {
  constructor(
    private api: ApiService,
    private lookup: AdminStockLookupService
  ) {
    this.lookup.onStocksLoaded(() => {
      if (!this.stockSearchQuery.trim()) {
        this.filteredStocks = [...this.lookup.allStocks];
      }
    });
  }

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
    sharesOutstanding: null,
    earningsGrowthRate: null,
    epsGrowthRate: null,
    freeCashFlow: null,
    currency: 'EGP',
    sourceLastUpdateText: 'تعديل يدوي عبر لوحة الإدارة',
    recalculateRatios: true
  };

  onSearchInput(): void {
    const q = this.stockSearchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredStocks = [...this.lookup.allStocks];
      return;
    }
    this.filteredStocks = this.lookup.allStocks.filter(s =>
      s.ticker.toLowerCase().includes(q) ||
      (s.nameAr && s.nameAr.toLowerCase().includes(q)) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q))
    );

    // If exact ticker match typed, auto-select
    const exact = this.lookup.allStocks.find(s => s.ticker.toLowerCase() === q);
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
          const match = this.lookup.allStocks.find(s => s.ticker === ticker);
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
            peRatio: null, pbRatio: null,
            sharesOutstanding: null, earningsGrowthRate: null, epsGrowthRate: null, freeCashFlow: null,
            currency: 'EGP',
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
      sharesOutstanding: data.sharesOutstanding ?? null,
      earningsGrowthRate: data.earningsGrowthRate ?? null,
      epsGrowthRate: data.epsGrowthRate ?? null,
      freeCashFlow: data.freeCashFlow ?? null,
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
      sharesOutstanding: this.marketForm.sharesOutstanding,
      earningsGrowthRate: this.marketForm.earningsGrowthRate,
      epsGrowthRate: this.marketForm.epsGrowthRate,
      freeCashFlow: this.marketForm.freeCashFlow,
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
}
