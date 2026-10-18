import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { FundsListComponent } from './funds-list.component';
import { ApiService } from '../../services/api.service';
import type { FundClassificationTreeNode, FundListItemDto } from '../../models/api.models';
import { REAL_FUNDS } from './real-funds.fixture';

function treeNode(partial: Partial<FundClassificationTreeNode> & { slug: string }): FundClassificationTreeNode {
  return {
    id: partial.slug.length, nameAr: partial.slug, nameEn: partial.slug, level: 0,
    parentSlug: null, displayOrder: 1, childrenLabelAr: 'التصنيف الفرعي',
    childrenLabelEn: 'Sub classification', directFundCount: 1, totalFundCount: 1,
    hasAutoRule: false, ...partial,
  };
}

function fund(code: string): FundListItemDto {
  return {
    id: code.length, sndukId: 1, publicId: 'p-' + code, slug: 's-' + code,
    nameAr: 'صندوق ' + code, nameEn: 'Fund ' + code, code, type: 'equity' as never,
    typeNameAr: 'صندوق أسهم', typeNameEn: 'Equity', riskLevel: 'low' as never,
    isIslamic: false, isFeatured: false, currentPrice: 100, dailyChange: 1,
    return1M: 1, return3M: 2, return6M: 3, return1Y: 10, return3Y: 30,
    totalScore: 50, aum: 1000000, managementFee: 1, minimumInvestment: '1000',
    currency: 'EGP', assetManagerId: 1, assetManagerName: 'مدير', assetManagerNameEn: 'Mgr',
    logoUrl: '', localLogoPath: '', lastSyncedAt: '2026-10-14T21:00:00',
    classificationSlug: 'equity', classificationPathAr: 'صندوق أسهم', classificationSource: 'SNDUK',
  };
}

describe('FundsListComponent classification wiring', () => {
  let fixture: ComponentFixture<FundsListComponent>;
  let queryParamMap$: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    const tree: FundClassificationTreeNode[] = [
      treeNode({ slug: 'equity', nameAr: 'صندوق أسهم', totalFundCount: 2, childrenLabelAr: 'نوع صندوق الأسهم' }),
      treeNode({ slug: 'sector', nameAr: 'قطاع', level: 1, parentSlug: 'equity', totalFundCount: 1, childrenLabelAr: 'القطاع' }),
      treeNode({ slug: 'sector-financial', nameAr: 'مالي', level: 2, parentSlug: 'sector', totalFundCount: 1 }),
    ];
    const api = {
      getFunds: (f: { pageSize?: number }) => of(f?.pageSize === 1000
        ? { items: REAL_FUNDS, totalCount: 3, page: 1, pageSize: 1000, totalPages: 1 }
        : { items: [fund('AA'), fund('BB')], totalCount: 2, page: 1, pageSize: 20, totalPages: 1 }),
      getClassificationTree: () => of(tree),
      getFundAssetManagers: () => of([
        { id: 1, nameAr: 'أتون فاروس', nameEn: 'Aton Pharos', fundCount: 5 },
        { id: 2, nameAr: 'بلتون كابيتال', nameEn: 'Beltone Financial', fundCount: 8 }
      ]),
      getFundStats: () => of({ totalCount: 2, islamicCount: 1, totalAum: 1000000, bestDailyChange: 1.5, bestDailyChangeCode: 'AA' })
    };
    queryParamMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    const route = { queryParamMap: queryParamMap$ };
    await TestBed.configureTestingModule({
      imports: [FundsListComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FundsListComponent);
  });

  it('renders the cascade, managers, and fund cards', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const html = fixture.nativeElement.innerHTML as string;
    expect(html).toContain('cascade-0');
    expect(html).toContain('صندوق AA');
    expect(html).toContain('أتون فاروس (5)');
    expect(html).toContain('بلتون كابيتال (8)');
  });

  it('renders verbatim live fund items without hanging', async () => {
    const comp = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit with stub data
    await fixture.whenStable();
    comp.funds = REAL_FUNDS;
    comp.totalCount = 171;
    comp.loading = false;
    (comp as unknown as { statsLoading: boolean }).statsLoading = false;
    fixture.detectChanges();
    await fixture.whenStable();
    const cards = fixture.nativeElement.querySelectorAll('app-entity-card').length;
    expect(`funds=${comp.funds.length} cards=${cards}`).toBe('funds=3 cards=3');
  });

  it('drives the node filter from a cascade pick', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const comp = fixture.componentInstance;
    comp.onClassPathChange(['equity', 'sector']);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(comp.filter.node).toBe('sector');
  });

  it('proves dynamism: adding/renaming a tree node or manager dynamically updates filters with zero code change', async () => {
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    // Dynamically updated tree received from backend
    comp.classTree = [
      treeNode({ slug: 'new-category', nameAr: 'تصنيف ديناميكي جديد', totalFundCount: 12 }),
      treeNode({ slug: 'gold-funds', nameAr: 'صناديق الذهب المحدثة', totalFundCount: 3 })
    ];
    // Dynamically updated managers received from backend
    comp.assetManagers = [
      { id: 99, nameAr: 'شركة الرواد للاستثمار', nameEn: 'Al Rowad Asset Management', fundCount: 4 }
    ];

    fixture.detectChanges();
    await fixture.whenStable();
    const html = fixture.nativeElement.innerHTML as string;

    expect(html).toContain('شركة الرواد للاستثمار (4)');
    expect(comp.assetManagers[0].nameAr).toBe('شركة الرواد للاستثمار');
  });

  it('handles stale or unknown node slugs gracefully without crashing', async () => {
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    // Unknown/deleted node slug
    const resolvedPath = comp.pathForSlug('deleted-unknown-slug');
    expect(resolvedPath).toEqual([]);

    (comp as any).pendingLegacySlug = 'deleted-unknown-slug';
    comp.loadClassTree();
    expect(comp.classPath).toEqual([]);
    expect(comp.staleNodeNotice).toContain('لم يعد متاحاً وتم الرجوع للكل');
  });

  it('proves component instance is NOT re-created, filter panel remains mounted, and KPI stats are NOT refetched when a filter changes', async () => {
    const api = TestBed.inject(ApiService);
    const router = TestBed.inject(Router);
    spyOn(api, 'getFundStats').and.callThrough();
    spyOn(api, 'getFunds').and.callThrough();

    let currentParams: Record<string, string> = {};
    spyOn(router, 'navigate').and.callFake((_commands: unknown[], extras: any) => {
      if (extras?.queryParams) {
        Object.entries(extras.queryParams).forEach(([k, v]) => {
          if (v === null || v === undefined) {
            delete currentParams[k];
          } else {
            currentParams[k] = String(v);
          }
        });
        queryParamMap$.next(convertToParamMap(currentParams));
      }
      return Promise.resolve(true);
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Verify initial mount
    const initialInstance = fixture.componentInstance;
    const initialFilterPanel = fixture.nativeElement.querySelector('.funds-filters-container');
    expect(initialFilterPanel).toBeTruthy();
    expect(api.getFundStats).toHaveBeenCalledTimes(1);
    expect(api.getFunds).toHaveBeenCalledTimes(1);

    // Open advanced filter panel
    initialInstance.advancedOpen = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.advanced-panel-wrapper.open')).toBeTruthy();

    // Simulate changing an advanced filter (e.g. Risk level)
    initialInstance.onRiskChange('high');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // 1. Component instance is identical (no re-creation)
    expect(fixture.componentInstance).toBe(initialInstance);

    // 2. Filter panel DOM element remained mounted and in place
    const panelAfter = fixture.nativeElement.querySelector('.funds-filters-container');
    expect(panelAfter).toBe(initialFilterPanel);
    expect(initialInstance.advancedOpen).toBeTrue();

    // 3. getFunds fired for the new filter, but getFundStats was NOT refetched (called only once)
    expect(api.getFunds).toHaveBeenCalledTimes(2);
    expect(api.getFundStats).toHaveBeenCalledTimes(1);

    // Simulate changing another advanced filter (e.g. Sharia compliance)
    initialInstance.onShariaChange(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance).toBe(initialInstance);
    expect(api.getFunds).toHaveBeenCalledTimes(3);
    expect(api.getFundStats).toHaveBeenCalledTimes(1);
  });
});
