import { Injectable } from '@angular/core';
import { SessionCacheService } from '../../../core/services/session-cache.service';
import { ApiService } from '../../../core/api/api.service';
import { StockManagementItem, SectorPickerItem, IndexPickerItem } from '../../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminStocksManagementService {
  constructor(
    private api: ApiService,
    private cache: SessionCacheService
  ) {}

  // Stocks management tab
  mgmtSearch = '';

  mgmtStocks: import('../../../shared/models/api.models').StockManagementItem[] = [];

  mgmtSectors: import('../../../shared/models/api.models').SectorPickerItem[] = [];

  mgmtIndices: import('../../../shared/models/api.models').IndexPickerItem[] = [];

  mgmtLoading = false;

  mgmtBusy = false;

  mgmtMessage = '';

  mgmtError = false;

  mgmtPickedSector: Record<number, number | undefined> = {};

  mgmtPickedIndex: Record<number, number | undefined> = {};

  showCreateStockModal = false;

  newStock: { ticker: string; nameAr: string; nameEn: string; sectorId: number | null } =
    { ticker: '', nameAr: '', nameEn: '', sectorId: null };

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
        this.cache.clear();
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
        this.cache.clear();
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
