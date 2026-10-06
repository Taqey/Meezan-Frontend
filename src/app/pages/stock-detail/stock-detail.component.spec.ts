import { ElementRef } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { MarketDataDto, SupportResistanceDto } from '../../models/api.models';
import { StockDetailComponent } from './stock-detail.component';

describe('StockDetailComponent trackOpinionByKey', () => {
  async function create(): Promise<StockDetailComponent> {
    await TestBed.configureTestingModule({
      imports: [StockDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: ApiService, useValue: {} },
        { provide: ElementRef, useValue: { nativeElement: document.createElement('div') } }
      ]
    }).compileComponents();
    // No detectChanges: subscriptions and HTTP never run; only the pure
    // trackBy helper is exercised.
    return TestBed.createComponent(StockDetailComponent).componentInstance;
  }

  it('identifies opinion cards by board source key across fresh arrays', async () => {
    const component = await create();
    const view = (key: number) => ({
      sourceKey: key,
      status: 'Compliant',
      noOpinion: false,
      rawDisplayStatus: 'Compliant',
      effectiveStatus: 'Compliant',
      upgraded: false
    } as never);
    // A rebuilt view object for the same board maps to the same key,
    // so Angular keeps the card DOM (and its entrance animation plays once).
    expect(component.trackOpinionByKey(0, view(1))).toBe(1);
    expect(component.trackOpinionByKey(4, view(1))).toBe(1);
    expect(component.trackOpinionByKey(0, view(2))).toBe(2);
  });
});

describe('StockDetailComponent opinion cards stability', () => {
  it('does not remount cards when later async data arrives (animation plays once)', fakeAsync(() => {
    const marketData: MarketDataDto = {
      ticker: 'ABUK',
      nameAr: 'أبو قير',
      indices: [],
      shariahStatus: 'NonCompliant',
      shariahOpinions: [
        { sourceKey: 1, status: 'Compliant', percentage: 50 },
        { sourceKey: 2, status: 'NonCompliant' }
      ],
      activityCompliant: true,
      shariahMetrics: {
        spHaramEarningPercentage: 8.5,
        loansPercentage: 0
      }
    };
    // Support/resistance arrives strictly AFTER market data — the exact
    // sequence that used to rebuild every card and replay its animation.
    const supportResistance$ = new Subject<SupportResistanceDto>();
    const apiMock = {
      getMarketData: () => of(marketData),
      getSupportResistance: () => supportResistance$.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [StockDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ code: 'ABUK' })) } },
        { provide: ApiService, useValue: apiMock },
        { provide: ElementRef, useValue: { nativeElement: document.createElement('div') } }
      ]
    });
    const fixture = TestBed.createComponent(StockDetailComponent);
    fixture.detectChanges();
    tick();

    const cards = (): HTMLElement[] =>
      fixture.debugElement.queryAll(By.css('.source-card')).map((el) => el.nativeElement as HTMLElement);
    const before = cards();
    // 7 board cards + the EGX33 info card.
    expect(before.length).toBe(8);

    supportResistance$.next({ ticker: 'ABUK', changePct: 1.5 });
    tick();
    fixture.detectChanges();
    tick();

    const after = cards();
    expect(after.length).toBe(before.length);
    // Same DOM nodes → no remount → entrance animation played exactly once.
    after.forEach((el, i) => expect(el.isSameNode(before[i])).toBeTrue());
  }));
});
