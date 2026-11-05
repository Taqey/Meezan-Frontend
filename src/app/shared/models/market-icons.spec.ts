import { indexIconFor, indexShowsAggregates, sectorIconFor } from './market-icons';

describe('market-icons config', () => {
  it('hides aggregates only for the Sectoral-Indices umbrella entry', () => {
    expect(indexShowsAggregates('Sectoral-Indices')).toBeFalse();
    for (const code of ['EGX30', 'EGX100', 'EGX 33', 'EGX70', 'EGX35-LV', 'EGX30TR', 'TAMAYUZ', 'UNKNOWN']) {
      expect(indexShowsAggregates(code)).toBeTrue();
    }
  });

  it('resolves every known index and sector to a real icon (fallbacks otherwise)', () => {
    for (const code of ['EGX30', 'EGX 33', 'Sectoral-Indices', 'NOPE']) {
      expect(indexIconFor(code)).toBeTruthy();
    }
    expect(sectorIconFor('Banks')).toBeTruthy();
    expect(sectorIconFor('Real Estate')).toBeTruthy();
    expect(sectorIconFor('No Such Sector')).toBeTruthy();
  });
});
