import {
  calculatePurification,
  FAISAL_SUB_ROW,
  PURIFICATION_APPROACHES
} from './purification';

describe('purification approaches data', () => {
  it('defines the three approaches with the required fields', () => {
    expect(PURIFICATION_APPROACHES.map((a) => a.id)).toEqual([
      'ownership',
      'received-profits',
      'dividends-only'
    ]);
    for (const a of PURIFICATION_APPROACHES) {
      expect(a.titleAr.trim().length).toBeGreaterThan(0);
      expect(a.bodies.length).toBeGreaterThan(0);
      expect(a.formulaAr.trim().length).toBeGreaterThan(0);
      expect(a.summaryAr.trim().length).toBeGreaterThan(0);
    }
  });

  it('marks capital-gain coverage per approach, with Faisal as a sub-row', () => {
    const byId: Record<string, { includesDividends: boolean; includesCapitalGain: boolean }> = {};
    for (const a of PURIFICATION_APPROACHES) byId[a.id] = a;
    expect(byId['ownership']).toEqual(jasmine.objectContaining({ includesDividends: false, includesCapitalGain: false }));
    expect(byId['received-profits']).toEqual(jasmine.objectContaining({ includesDividends: true, includesCapitalGain: true }));
    expect(byId['dividends-only']).toEqual(jasmine.objectContaining({ includesDividends: true, includesCapitalGain: false }));
    expect(FAISAL_SUB_ROW.includesDividends).toBeTrue();
    expect(FAISAL_SUB_ROW.includesCapitalGain).toBeTrue();
  });
});

describe('calculatePurification', () => {
  it('computes the received-profits example: 2% of (1200 + 300) = 30 EGP', () => {
    expect(calculatePurification(1200, 300, 2, 'received-profits')).toBe(30);
  });

  it('computes the dividends-only example: 2% of 1200 = 24 EGP', () => {
    expect(calculatePurification(1200, 300, 2, 'dividends-only')).toBe(24);
  });

  it('ignores capital gain for dividends-only', () => {
    expect(calculatePurification(1200, 9999, 2, 'dividends-only')).toBe(24);
  });

  it('returns null when the ratio is missing or invalid', () => {
    expect(calculatePurification(1200, 300, null, 'received-profits')).toBeNull();
    expect(calculatePurification(1200, 300, undefined, 'dividends-only')).toBeNull();
    expect(calculatePurification(1200, 300, NaN, 'received-profits')).toBeNull();
    expect(calculatePurification(1200, 300, -1, 'received-profits')).toBeNull();
  });

  it('treats missing amounts as zero', () => {
    expect(calculatePurification(null, null, 2, 'received-profits')).toBe(0);
    expect(calculatePurification(null, 300, 2, 'received-profits')).toBe(6);
    expect(calculatePurification(undefined, undefined, 2, 'dividends-only')).toBe(0);
  });

  it('treats negative amounts as zero and rounds to two decimals', () => {
    expect(calculatePurification(-500, 300, 2, 'received-profits')).toBe(6);
    expect(calculatePurification(100, 0, 2.555, 'dividends-only')).toBe(2.56);
  });

  it('returns zero for a zero ratio', () => {
    expect(calculatePurification(1200, 300, 0, 'received-profits')).toBe(0);
  });
});
