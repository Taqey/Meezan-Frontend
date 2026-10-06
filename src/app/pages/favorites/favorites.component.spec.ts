import { TestBed } from '@angular/core/testing';
import { ApiService } from '../../services/api.service';
import { FavoritesComponent } from './favorites.component';
import { StockListItemDto } from '../../models/api.models';

describe('FavoritesComponent trackStockByTicker', () => {
  async function create(): Promise<FavoritesComponent> {
    await TestBed.configureTestingModule({
      imports: [FavoritesComponent],
      providers: [{ provide: ApiService, useValue: {} }]
    }).compileComponents();
    // No detectChanges: the template (and its HTTP/data loading) never runs;
    // only the pure trackBy helper is exercised.
    return TestBed.createComponent(FavoritesComponent).componentInstance;
  }

  it('identifies cards by ticker so change detection never remounts them', async () => {
    const component = await create();
    const a = { ticker: 'ABUK' } as StockListItemDto;
    const b = { ticker: 'COMI' } as StockListItemDto;
    expect(component.trackStockByTicker(0, a)).toBe('ABUK');
    expect(component.trackStockByTicker(5, b)).toBe('COMI');
    // Same ticker at a different index is the same card (stable identity).
    expect(component.trackStockByTicker(0, a)).toBe(component.trackStockByTicker(3, a));
  });
});
