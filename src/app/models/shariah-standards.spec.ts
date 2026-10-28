import {
  evaluateStandards,
  getEffectiveSourceStatuses,
  resolveInternalVerdict,
  resolveVerdictWithScholars,
  isViaScholarsOnly,
  normalizeStatusValue,
  shouldUpgradeDoubtfulToCompliant,
  SHARIAH_STANDARDS,
  scholarsDebtMax,
  CRITERION_ORDER,
  type SourceStatusInput
} from './shariah-standards';

describe('shariah-standards config', () => {
  it('defines exactly the five standards with thresholds in one place', () => {
    expect(SHARIAH_STANDARDS.length).toBe(5);
    expect(SHARIAH_STANDARDS.map((s) => s.id)).toEqual(['egx33', 'dfm', 'aaoifi', 'sp', 'klsi']);
    for (const s of SHARIAH_STANDARDS) {
      expect(s.nameAr.trim().length).toBeGreaterThan(0);
      expect(s.nameEn.trim().length).toBeGreaterThan(0);
      expect(s.subtitleAr.trim().length).toBeGreaterThan(0);
    }
  });

  it('exposes the individual-scholars debt ceiling of 50', () => {
    expect(scholarsDebtMax).toBe(50);
  });
});

describe('evaluateStandards', () => {
  it('passes all standards when every ratio is within every threshold', () => {
    const r = evaluateStandards({ prohibitedRevenue: 4, debt: 10, prohibitedInvestments: 10, cash: 20 });
    expect(r.totalCount).toBe(5);
    expect(r.passedCount).toBe(5);
    for (const s of r.standards) {
      expect(s.hasData).toBeTrue();
      expect(s.passed).toBeTrue();
    }
    expect(shouldUpgradeDoubtfulToCompliant(true, r)).toBeTrue();
  });

  it('ABUK worked example: 3 of 5 pass (EGX33, DFM, KLSI) with missing investments/cash', () => {
    const r = evaluateStandards({ prohibitedRevenue: 8.5, debt: 0, prohibitedInvestments: null, cash: null });
    expect(r.totalCount).toBe(5);
    expect(r.passedCount).toBe(3);
    const byId: Record<string, boolean> = {};
    for (const s of r.standards) byId[s.standard.id] = s.passed;
    expect(byId['egx33']).toBeTrue(); // 8.5 ≤ 10, 0 ≤ 33
    expect(byId['dfm']).toBeTrue();   // 8.5 ≤ 10, 0 ≤ 30
    expect(byId['aaoifi']).toBeFalse(); // 8.5 > 5
    expect(byId['sp']).toBeFalse();     // 8.5 > 5
    expect(byId['klsi']).toBeTrue();  // 8.5 ≤ 20, 0 ≤ 33
    // Missing criteria are "no data" and excluded, shown as "—".
    for (const s of r.standards) {
      expect(s.criteria['prohibitedInvestments'].hasData).toBeFalse();
      expect(s.criteria['prohibitedInvestments'].value).toBeNull();
      expect(s.criteria['cash'].hasData).toBeFalse();
    }
    expect(shouldUpgradeDoubtfulToCompliant(true, r)).toBeTrue();
  });

  it('exactly one passing standard still upgrades a doubtful card to compliant', () => {
    // Only KLSI tolerates 15% prohibited revenue.
    const r = evaluateStandards({ prohibitedRevenue: 15, debt: 0, prohibitedInvestments: 0, cash: 0 });
    expect(r.totalCount).toBe(5);
    expect(r.passedCount).toBe(1);
    expect(r.standards.find((s) => s.standard.id === 'klsi')!.passed).toBeTrue();
    expect(shouldUpgradeDoubtfulToCompliant(true, r)).toBeTrue();
  });

  it('failing all standards keeps the doubtful card doubtful', () => {
    const r = evaluateStandards({ prohibitedRevenue: 60, debt: 80, prohibitedInvestments: 80, cash: 90 });
    expect(r.totalCount).toBe(5);
    expect(r.passedCount).toBe(0);
    for (const s of r.standards) expect(s.passed).toBeFalse();
    expect(shouldUpgradeDoubtfulToCompliant(true, r)).toBeFalse();
  });

  it('never applies the upgrade when the card is not doubtful', () => {
    const passing = evaluateStandards({ prohibitedRevenue: 1, debt: 1, prohibitedInvestments: 1, cash: 1 });
    expect(shouldUpgradeDoubtfulToCompliant(false, passing)).toBeFalse();
  });

  it('excludes missing criteria instead of treating them as 0', () => {
    // Revenue missing, debt 40% fails every debt ceiling (30/33).
    // If null were treated as 0, revenue 0 ≤ max would misleadingly "pass".
    const r = evaluateStandards({ prohibitedRevenue: null, debt: 40 });
    expect(r.totalCount).toBe(5);
    expect(r.passedCount).toBe(0);
    for (const s of r.standards) {
      expect(s.criteria['prohibitedRevenue'].hasData).toBeFalse();
      expect(s.hasData).toBeTrue(); // debt alone still counts as available
      expect(s.passed).toBeFalse();
    }
    expect(shouldUpgradeDoubtfulToCompliant(true, r)).toBeFalse();
  });

  it('passes a standard on the available criteria alone when others are missing', () => {
    const r = evaluateStandards({ prohibitedRevenue: null, debt: 5 });
    expect(r.totalCount).toBe(5);
    expect(r.passedCount).toBe(5);
  });

  it('marks everything "no data" when all ratios are missing', () => {
    const r = evaluateStandards({ prohibitedRevenue: null, debt: null, prohibitedInvestments: null, cash: null });
    expect(r.totalCount).toBe(0);
    expect(r.passedCount).toBe(0);
    for (const s of r.standards) {
      expect(s.hasData).toBeFalse();
      expect(s.passed).toBeFalse();
      for (const key of CRITERION_ORDER) {
        expect(s.criteria[key].hasData).toBeFalse();
        expect(s.criteria[key].passed).toBeFalse();
      }
    }
    expect(shouldUpgradeDoubtfulToCompliant(true, r)).toBeFalse();
  });

  it('treats undefined and NaN ratios as missing too', () => {
    const r = evaluateStandards({ prohibitedRevenue: undefined, debt: NaN, prohibitedInvestments: 5, cash: 5 });
    expect(r.totalCount).toBe(5);
    expect(r.passedCount).toBe(5);
    for (const s of r.standards) {
      expect(s.criteria['prohibitedRevenue'].hasData).toBeFalse();
      expect(s.criteria['debt'].hasData).toBeFalse();
    }
  });

  it('uses inclusive comparison: exactly at the threshold passes', () => {
    // Exactly 10%: passes EGX33/DFM (max 10), fails AAOIFI/S&P (max 5).
    const ten = evaluateStandards({ prohibitedRevenue: 10, debt: 0, prohibitedInvestments: 0, cash: 0 });
    expect(ten.standards.find((s) => s.standard.id === 'egx33')!.criteria['prohibitedRevenue'].passed).toBeTrue();
    expect(ten.standards.find((s) => s.standard.id === 'aaoifi')!.criteria['prohibitedRevenue'].passed).toBeFalse();

    // Exactly 5%: passes AAOIFI/S&P too.
    const five = evaluateStandards({ prohibitedRevenue: 5, debt: 30, prohibitedInvestments: 30, cash: 70 });
    expect(five.passedCount).toBe(5);
    expect(five.standards.find((s) => s.standard.id === 'sp')!.passed).toBeTrue();
  });

  it('fails just above the threshold', () => {
    const r = evaluateStandards({ prohibitedRevenue: 10.01, debt: 0, prohibitedInvestments: 0, cash: 0 });
    expect(r.standards.find((s) => s.standard.id === 'egx33')!.criteria['prohibitedRevenue'].passed).toBeFalse();
    // KLSI (max 20) still passes on revenue.
    expect(r.standards.find((s) => s.standard.id === 'klsi')!.passed).toBeTrue();
    expect(r.passedCount).toBe(1);
  });

  it('returns value and max per criterion for the UI', () => {
    const r = evaluateStandards({ prohibitedRevenue: 8.5, debt: 0 });
    const egx33 = r.standards.find((s) => s.standard.id === 'egx33')!;
    expect(egx33.criteria['prohibitedRevenue']).toEqual({ value: 8.5, max: 10, passed: true, hasData: true });
    expect(egx33.criteria['debt']).toEqual({ value: 0, max: 33, passed: true, hasData: true });
  });
});

describe('getEffectiveSourceStatuses', () => {
  const HB = 1;
  const MUS = 2;

  function abukSources(): SourceStatusInput[] {
    return [
      { sourceKey: HB, status: 'Compliant', percentage: 50, noOpinion: false },
      { sourceKey: MUS, status: 'NonCompliant', percentage: null, noOpinion: false },
      { sourceKey: 3, status: null, percentage: null, noOpinion: true }
    ];
  }

  const abukEval = evaluateStandards({ prohibitedRevenue: 8.5, debt: 0 });

  it('upgrades a doubtful Bourse Halal card that passes standards', () => {
    const out = getEffectiveSourceStatuses(abukSources(), abukEval, HB);
    const hb = out.find((s) => s.sourceKey === HB)!;
    expect(hb.rawDisplayStatus).toBe('doubtful');
    expect(hb.effectiveStatus).toBe('Compliant');
    expect(hb.upgraded).toBeTrue();
    // Other sources are untouched.
    const mus = out.find((s) => s.sourceKey === MUS)!;
    expect(mus.effectiveStatus).toBe('NonCompliant');
    expect(mus.upgraded).toBeFalse();
    // No-opinion stays null.
    expect(out.find((s) => s.sourceKey === 3)!.effectiveStatus).toBeNull();
  });

  it('does not apply the upgrade when Bourse Halal is already compliant', () => {
    const sources: SourceStatusInput[] = [
      { sourceKey: HB, status: 'Compliant', percentage: 100, noOpinion: false }
    ];
    const out = getEffectiveSourceStatuses(sources, abukEval, HB);
    expect(out[0].rawDisplayStatus).toBe('Compliant');
    expect(out[0].effectiveStatus).toBe('Compliant');
    expect(out[0].upgraded).toBeFalse();
  });

  it('keeps a doubtful card doubtful when no standard passes', () => {
    const failing = evaluateStandards({ prohibitedRevenue: 60, debt: 80 });
    const out = getEffectiveSourceStatuses(abukSources(), failing, HB);
    const hb = out.find((s) => s.sourceKey === HB)!;
    expect(hb.rawDisplayStatus).toBe('doubtful');
    expect(hb.effectiveStatus).toBe('doubtful');
    expect(hb.upgraded).toBeFalse();
  });

  it('keeps a non-compliant Bourse Halal card as is', () => {
    const sources: SourceStatusInput[] = [
      { sourceKey: HB, status: 'NonCompliant', percentage: null, noOpinion: false }
    ];
    const out = getEffectiveSourceStatuses(sources, abukEval, HB);
    expect(out[0].effectiveStatus).toBe('NonCompliant');
    expect(out[0].upgraded).toBeFalse();
  });

  it('upgrades an explicitly stored doubtful status too', () => {
    const sources: SourceStatusInput[] = [
      { sourceKey: HB, status: 'Doubtful', percentage: null, noOpinion: false }
    ];
    const out = getEffectiveSourceStatuses(sources, abukEval, HB);
    expect(out[0].effectiveStatus).toBe('Compliant');
    expect(out[0].upgraded).toBeTrue();
  });
});

describe('resolveInternalVerdict', () => {
  it('is compliant when the override is the only compliant source', () => {
    expect(resolveInternalVerdict(['Compliant', 'NonCompliant', null], 'NonCompliant')).toBe('Compliant');
  });

  it('matches previous behavior when Bourse Halal was already compliant', () => {
    expect(resolveInternalVerdict(['Compliant', 'NonCompliant'], 'NonCompliant')).toBe('Compliant');
  });

  it('falls back to the stored verdict when everything is red', () => {
    expect(resolveInternalVerdict(['NonCompliant', 'doubtful', null], 'NonCompliant')).toBe('NonCompliant');
    expect(resolveInternalVerdict(['Pending', null], 'Pending')).toBe('Pending');
  });

  it('is compliant in the mixed case via the other source', () => {
    expect(resolveInternalVerdict(['doubtful', 'Compliant'], 'NonCompliant')).toBe('Compliant');
  });

  it('returns null when nothing is compliant and there is no fallback', () => {
    expect(resolveInternalVerdict([null, null], null)).toBeNull();
  });
});

describe('resolveVerdictWithScholars (corrected rule)', () => {
  it('FWRY: revenue 33%, debt 17.1% -> NonCompliant (revenue exceeds every max)', () => {
    const ev = evaluateStandards({ prohibitedRevenue: 33, debt: 17.1 });
    expect(resolveVerdictWithScholars(ev, 17.1)).toBe('NonCompliant');
    expect(isViaScholarsOnly(ev, 17.1)).toBeFalse();
  });

  it('MIPH: revenue 0.89%, debt 34.12% -> Compliant via scholars only', () => {
    const ev = evaluateStandards({ prohibitedRevenue: 0.89, debt: 34.12 });
    expect(ev.passedCount).toBe(0);
    expect(resolveVerdictWithScholars(ev, 34.12)).toBe('Compliant');
    expect(isViaScholarsOnly(ev, 34.12)).toBeTrue();
  });

  it('debt available but revenue missing -> Pending (insufficient)', () => {
    const ev = evaluateStandards({ prohibitedRevenue: null, debt: 10 });
    expect(resolveVerdictWithScholars(ev, 10)).toBe('Pending');
  });

  it('revenue available but debt missing -> Pending (insufficient)', () => {
    const ev = evaluateStandards({ prohibitedRevenue: 5, debt: null });
    expect(resolveVerdictWithScholars(ev, null)).toBe('Pending');
  });

  it('both missing -> Pending (insufficient)', () => {
    const ev = evaluateStandards({ prohibitedRevenue: null, debt: null });
    expect(resolveVerdictWithScholars(ev, null)).toBe('Pending');
  });

  it('investments/cash missing -> verdict computed normally', () => {
    const ev = evaluateStandards({ prohibitedRevenue: 4, debt: 10, prohibitedInvestments: null, cash: null });
    expect(resolveVerdictWithScholars(ev, 10)).toBe('Compliant');
    expect(isViaScholarsOnly(ev, 10)).toBeFalse();
  });

  it('debt <= 50 but revenue above every max -> NonCompliant', () => {
    const ev = evaluateStandards({ prohibitedRevenue: 33, debt: 10 });
    expect(resolveVerdictWithScholars(ev, 10)).toBe('NonCompliant');
  });

  it('debt > 50 -> NonCompliant', () => {
    const ev = evaluateStandards({ prohibitedRevenue: 2, debt: 51 });
    expect(resolveVerdictWithScholars(ev, 51)).toBe('NonCompliant');
    expect(isViaScholarsOnly(ev, 51)).toBeFalse();
  });

  it('fully passing a main standard -> Compliant, not via scholars', () => {
    const ev = evaluateStandards({ prohibitedRevenue: 4, debt: 10, prohibitedInvestments: 10, cash: 20 });
    expect(resolveVerdictWithScholars(ev, 10)).toBe('Compliant');
    expect(isViaScholarsOnly(ev, 10)).toBeFalse();
  });

  it('never returns a doubtful value', () => {
    const cases = [
      evaluateStandards({ prohibitedRevenue: 33, debt: 17.1 }),
      evaluateStandards({ prohibitedRevenue: null, debt: null })
    ];
    for (const ev of cases) {
      const v = resolveVerdictWithScholars(ev, 17.1);
      expect(normalizeStatusValue(v)).not.toBe('doubtful');
      expect(v).not.toContain('مشكوك');
    }
  });

  it('merged compliance filter returns scholars-only stocks as Compliant', () => {
    // Both standard-compliant and scholars-only stocks have overall verdict Compliant.
    // A single Compliant filter returns both without requiring a separate scholars filter.
    const standardCompliantStock = { ticker: 'ABUK', shariahStatus: 'Compliant', viaScholarsOnly: false };
    const scholarsOnlyStock = { ticker: 'MIPH', shariahStatus: 'Compliant', viaScholarsOnly: true };
    const nonCompliantStock = { ticker: 'FWRY', shariahStatus: 'NonCompliant', viaScholarsOnly: false };

    const selectedFilter = 'Compliant';
    const list = [standardCompliantStock, scholarsOnlyStock, nonCompliantStock];
    const filtered = list.filter(s => s.shariahStatus === selectedFilter);

    expect(filtered.map(s => s.ticker)).toEqual(['ABUK', 'MIPH']);
    expect(filtered.some(s => s.viaScholarsOnly)).toBeTrue();
  });
});
