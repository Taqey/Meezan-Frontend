import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { AdminStockLookupItem } from '../../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminStockLookupService {
  constructor(
    private api: ApiService
  ) {}

  private listeners: Array<() => void> = [];

  onStocksLoaded(fn: () => void): void {
    this.listeners.push(fn);
    if (this.allStocks.length > 0) fn();
  }

  private onLoaded(): void {
    for (const fn of this.listeners) fn();
  }

  allStocks: AdminStockLookupItem[] = [];

  loadStocks(): void {
    this.api.getAdminStocksLookup().subscribe({
      next: (stocks) => {
        this.allStocks = stocks || [];
        this.onLoaded();
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
            this.onLoaded();
          }
        });
      }
    });
  }
}
