import { FavoritesService } from './favorites.service';
import {
  FAVORITES_STORAGE_KEY,
  InMemoryFavoritesAdapter,
  UnavailableFavoritesAdapter
} from './favorites-storage';

function setup(seededRaw?: string) {
  const adapter = new InMemoryFavoritesAdapter();
  if (seededRaw !== undefined) adapter.seedRaw(FAVORITES_STORAGE_KEY, seededRaw);
  return { service: new FavoritesService(adapter), adapter };
}

describe('FavoritesService store', () => {
  it('starts empty when nothing is stored', () => {
    const { service } = setup();
    expect(service.favorites()).toEqual([]);
    expect(service.count()).toBe(0);
    expect(service.isFavorite('ABUK')).toBeFalse();
  });

  it('adds, removes and toggles symbols (normalized to uppercase)', () => {
    const { service } = setup();
    expect(service.toggle(' abuk ')).toBe('added');
    expect(service.isFavorite('ABUK')).toBeTrue();
    expect(service.favorites()).toEqual(['ABUK']);
    expect(service.toggle('abuk')).toBe('removed');
    expect(service.isFavorite('ABUK')).toBeFalse();
  });

  it('persists toggles as a JSON symbol array', () => {
    const { service, adapter } = setup();
    service.toggle('ABUK');
    service.toggle('COMI');
    expect(adapter.readRaw(FAVORITES_STORAGE_KEY)).toBe('["ABUK","COMI"]');
  });

  it('loads a previously stored list', () => {
    const { service } = setup('["ABUK","COMI"]');
    expect(service.favorites()).toEqual(['ABUK', 'COMI']);
    expect(service.count()).toBe(2);
  });

  it('resets corrupted JSON to an empty list safely', () => {
    expect(setup('not-json{{{').service.favorites()).toEqual([]);
    expect(setup('{"a":1}').service.favorites()).toEqual([]);
    expect(setup('"ABUK"').service.favorites()).toEqual([]);
  });

  it('keeps only string entries and drops duplicates', () => {
    const { service } = setup('["ABUK", 42, null, "abuk ", "COMI", ""]');
    expect(service.favorites()).toEqual(['ABUK', 'COMI']);
  });

  it('falls back to in-memory state when storage is unavailable', () => {
    const service = new FavoritesService(new UnavailableFavoritesAdapter());
    expect(service.persisted()).toBeFalse();
    expect(service.toggle('ABUK')).toBe('added');
    expect(service.isFavorite('ABUK')).toBeTrue();
    expect(service.toggle('ABUK')).toBe('removed');
  });

  it('drops symbols that no longer exist in the stocks list', () => {
    const { service, adapter } = setup('["ABUK","GONE","comi"]');
    service.pruneUnknown(['ABUK', 'COMI', 'OTHER']);
    expect(service.favorites()).toEqual(['ABUK', 'COMI']);
    expect(adapter.readRaw(FAVORITES_STORAGE_KEY)).toBe('["ABUK","COMI"]');
  });

  it('clears all favorites', () => {
    const { service } = setup('["ABUK","COMI"]');
    service.clear();
    expect(service.favorites()).toEqual([]);
  });

  it('syncs across tabs via the storage event', () => {
    const { service } = setup('["ABUK"]');
    window.dispatchEvent(new StorageEvent('storage', {
      key: FAVORITES_STORAGE_KEY,
      newValue: '["ABUK","COMI"]'
    }));
    expect(service.favorites()).toEqual(['ABUK', 'COMI']);
  });

  it('ignores storage events for other keys', () => {
    const { service } = setup('["ABUK"]');
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'something-else',
      newValue: '["COMI"]'
    }));
    expect(service.favorites()).toEqual(['ABUK']);
  });
});
