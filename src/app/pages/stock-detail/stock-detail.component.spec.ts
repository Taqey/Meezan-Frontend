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

describe('StockDetailComponent stored Halal verdict', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: ApiService, useValue: {} },
        { provide: ElementRef, useValue: { nativeElement: document.createElement('div') } }
      ]
    }).compileComponents();
  });

  function withMarketData(md: Partial<MarketDataDto>): StockDetailComponent {
    const component = TestBed.createComponent(StockDetailComponent).componentInstance;
    component.marketData = {
      ticker: 'TEST',
      indices: [],
      shariahOpinions: [],
      ...md
    } as MarketDataDto;
    return component;
  }

  it('Halal card follows halalStatus, not the raw source value', () => {
    const component = withMarketData({
      shariahStatus: 'NonCompliant',
      halalStatus: 'NonCompliant',
      shariahOpinions: [{ sourceKey: 1, status: 'Compliant', percentage: 100 }]
    });
    const halal = component.sourceOpinionsList.find((o) => o.sourceKey === 1)!;
    // Raw "Compliant" alone never counts: the stored Halal verdict decides.
    expect(component.getCardStatus(halal)).toBe('NonCompliant');
    expect(component.getVerdictLabel(component.getCardStatus(halal))).toBe('غير متوافق');
  });

  it('Halal insufficient renders a neutral card with the missing-ratio message', () => {
    const component = withMarketData({
      shariahStatus: 'Pending',
      halalStatus: 'Pending',
      shariahMetrics: { loansPercentage: null, spHaramEarningPercentage: 5 } as never
    });
    const halal = component.sourceOpinionsList.find((o) => o.sourceKey === 1)!;
    expect(halal.noOpinion).toBeFalse();
    expect(component.getCardStatus(halal)).toBe('Pending');
    expect(component.getVerdictLabel('Pending')).toBe('البيانات غير كافية');
    // Dialog belongs to the Halal card: hidden while ratios are missing.
    expect(component.showDetailsButton).toBeFalse();
    expect(component.insufficientMessage).toContain('نسبة القروض والفوائد');
  });

  it('Halal sufficient shows the details button; fallback note only for BoardsFallback', () => {
    const sufficient = withMarketData({
      shariahStatus: 'Compliant',
      halalStatus: 'Compliant',
      viaScholarsOnly: false,
      verdictSource: 'Halal'
    });
    expect(sufficient.showDetailsButton).toBeTrue();
    expect(sufficient.showFallbackHeaderNote).toBeFalse();

    const fallback = withMarketData({
      shariahStatus: 'Compliant',
      halalStatus: 'Pending',
      verdictSource: 'BoardsFallback',
      shariahOpinions: [{ sourceKey: 2, status: 'Compliant' }]
    });
    expect(fallback.showFallbackHeaderNote).toBeTrue();
    expect(fallback.showScholarsHeaderNote).toBeFalse();
    // Halal insufficient is excluded from the counter denominator.
    expect(fallback.totalAvailableSourcesCount).toBe(1);
    expect(fallback.compliantSourcesCount).toBe(1);
  });

  it('scholars-only shows the scholars note, never the fallback note', () => {
    const component = withMarketData({
      shariahStatus: 'Compliant',
      halalStatus: 'Compliant',
      viaScholarsOnly: true,
      verdictSource: 'HalalScholars'
    });
    expect(component.showScholarsHeaderNote).toBeTrue();
    expect(component.showScholarsCardNote).toBeTrue();
    expect(component.showFallbackHeaderNote).toBeFalse();
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
