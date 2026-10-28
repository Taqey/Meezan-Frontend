import { ClassificationCascadeComponent } from './classification-cascade.component';
import type { FundClassificationTreeNode } from '../../models/api.models';

function node(partial: Partial<FundClassificationTreeNode> & { slug: string }): FundClassificationTreeNode {
  return {
    id: partial.slug.length,
    nameAr: partial.slug,
    nameEn: partial.slug,
    level: 0,
    parentSlug: null,
    displayOrder: 1,
    childrenLabelAr: 'التصنيف الفرعي',
    childrenLabelEn: 'Sub classification',
    directFundCount: 0,
    totalFundCount: 0,
    hasAutoRule: false,
    ...partial,
  };
}

const TREE: FundClassificationTreeNode[] = [
  node({ slug: 'equity', nameAr: 'أسهم', level: 0, displayOrder: 1, totalFundCount: 5, childrenLabelAr: 'نوع صندوق الأسهم' }),
  node({ slug: 'money_market', nameAr: 'نقدي', level: 0, displayOrder: 2, totalFundCount: 1 }),
  node({ slug: 'sector', nameAr: 'قطاع', level: 1, parentSlug: 'equity', displayOrder: 1, totalFundCount: 2, childrenLabelAr: 'القطاع' }),
  node({ slug: 'index', nameAr: 'مؤشر', level: 1, parentSlug: 'equity', displayOrder: 2, totalFundCount: 2, childrenLabelAr: 'المؤشر' }),
  node({ slug: 'sector-financial', nameAr: 'مالي', level: 2, parentSlug: 'sector', totalFundCount: 2 }),
  node({ slug: 'index-egx30', nameAr: 'EGX30', level: 2, parentSlug: 'index', totalFundCount: 1 }),
];

function setup(path: string[]): ClassificationCascadeComponent {
  const c = new ClassificationCascadeComponent();
  c.tree = TREE;
  c.path = path;
  c.ngOnChanges({
    tree: { currentValue: TREE, previousValue: undefined, firstChange: true, isFirstChange: () => true },
    path: { currentValue: path, previousValue: undefined, firstChange: true, isFirstChange: () => true }
  });
  return c;
}

describe('ClassificationCascadeComponent', () => {
  it('shows only the root level when nothing is selected', () => {
    const c = setup([]);
    expect(c.levels.length).toBe(1);
    expect(c.levelOptions(0).map(n => n.slug)).toEqual(['equity', 'money_market']);
  });

  it('opens a second level labelled by the parent node itself', () => {
    const c = setup(['equity']);
    expect(c.levels.length).toBe(2);
    expect(c.levels[1].label).toBe('نوع صندوق الأسهم');
    expect(c.levelOptions(1).map(n => n.slug)).toEqual(['sector', 'index']);
  });

  it('opens a third level labelled by the intermediate node', () => {
    const c = setup(['equity', 'sector']);
    expect(c.levels.length).toBe(3);
    expect(c.levels[2].label).toBe('القطاع');
    expect(c.levelOptions(2).map(n => n.slug)).toEqual(['sector-financial']);
  });

  it('stops at leaves without children', () => {
    const c = setup(['money_market']);
    expect(c.levels.length).toBe(1);
    expect(c.levels[0].node?.slug).toBe('money_market');
  });

  it('ignores unknown slugs in the path', () => {
    const c = setup(['nope']);
    expect(c.levels.length).toBe(1);
  });

  it('pick() rebuilds the path keeping ancestors', () => {
    const c = setup(['equity', 'sector']);
    const emitted: string[][] = [];
    c.pathChange.subscribe(p => emitted.push(p));
    c.pick(1, 'index');
    expect(emitted).toEqual([['equity', 'index']]);
  });

  it('pick() with empty slug clears that level down', () => {
    const c = setup(['equity', 'sector']);
    const emitted: string[][] = [];
    c.pathChange.subscribe(p => emitted.push(p));
    c.pick(1, '');
    expect(emitted).toEqual([['equity']]);
  });
});
