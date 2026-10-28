import { Inject, Injectable, InjectionToken, Optional, Signal, computed, signal } from '@angular/core';
import {
  FAVORITES_STORAGE_KEY,
  FavoritesStorageAdapter,
  InMemoryFavoritesAdapter,
  LocalStorageFavoritesAdapter,
  parseFavoriteSymbols
} from './favorites-storage';

/** DI token for the storage adapter (defaults to localStorage). */
export const FAVORITES_STORAGE_ADAPTER = new InjectionToken<FavoritesStorageAdapter>(
  'FavoritesStorageAdapter',
  {
    providedIn: 'root',
    factory: () => new LocalStorageFavoritesAdapter()
  }
);

export type FavoriteToggleResult = 'added' | 'removed';

/**
 * ONE shared favorites store (per device, no login).
 *
 * Components must use this service (`favorites`, `isFavorite()`,
 * `toggle()`) and never touch localStorage directly, so every view —
 * Stocks list, stock detail header, Favorites page, nav badge — stays
 * in sync, including across tabs via the `storage` event.
 */
@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private adapter: FavoritesStorageAdapter;
  private readonly symbols = signal<string[]>([]);

  /** Live list of favorite symbols (uppercase tickers). */
  readonly favorites: Signal<string[]> = this.symbols.asReadonly();

  /** Favorite count (nav badge). */
  readonly count = computed(() => this.symbols().length);

  /**
   * False when persistence is unavailable (private mode, quota, disabled):
   * favorites still work for the session via in-memory state, but the UI
   * should show a small non-blocking note that they will not be saved.
   */
  readonly persisted = signal(true);

  constructor(@Optional() @Inject(FAVORITES_STORAGE_ADAPTER) adapter?: FavoritesStorageAdapter | null) {
    this.adapter = adapter ?? new LocalStorageFavoritesAdapter();
    this.reloadFromStorage();
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('storage', (event: StorageEvent) => this.onExternalStorageEvent(event));
    }
  }

  isFavorite(symbol: string): boolean {
    return this.symbols().includes(FavoritesService.normalize(symbol));
  }

  /** Adds the symbol if absent, removes it if present. Returns what happened. */
  toggle(symbol: string): FavoriteToggleResult {
    const key = FavoritesService.normalize(symbol);
    if (!key) return 'removed';
    const current = this.symbols();
    const next = current.includes(key)
      ? current.filter((s) => s !== key)
      : [...current, key];
    this.commit(next);
    return current.includes(key) ? 'removed' : 'added';
  }

  remove(symbol: string): void {
    const key = FavoritesService.normalize(symbol);
    if (!key || !this.symbols().includes(key)) return;
    this.commit(this.symbols().filter((s) => s !== key));
  }

  clear(): void {
    if (!this.symbols().length) return;
    this.commit([]);
  }

  /**
   * Drops favorite symbols that no longer exist in the stocks list
   * (case-insensitive) and persists the pruned list.
   */
  pruneUnknown(knownTickers: string[]): void {
    const known = new Set((knownTickers || []).map((t) => FavoritesService.normalize(t)));
    const pruned = this.symbols().filter((s) => known.has(s));
    if (pruned.length !== this.symbols().length) {
      this.commit(pruned);
    }
  }

  private commit(next: string[]): void {
    this.symbols.set(next);
    this.persist(next);
  }

  private persist(next: string[]): void {
    try {
      this.adapter.writeRaw(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable mid-session: keep memory state, stop persisting.
      this.adapter = new InMemoryFavoritesAdapter();
      try {
        this.adapter.writeRaw(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // In-memory never throws; defensive only.
      }
      this.persisted.set(false);
    }
  }

  private reloadFromStorage(): void {
    let raw: string | null = null;
    try {
      raw = this.adapter.readRaw(FAVORITES_STORAGE_KEY);
    } catch {
      this.adapter = new InMemoryFavoritesAdapter();
      this.persisted.set(false);
      this.symbols.set([]);
      return;
    }
    this.symbols.set(parseFavoriteSymbols(raw));
  }

  /** Cross-tab sync: another tab changed our key → adopt its validated list. */
  private onExternalStorageEvent(event: StorageEvent): void {
    if (!event || event.key !== FAVORITES_STORAGE_KEY) return;
    try {
      // Re-read through the adapter so validation stays in one place.
      // event.newValue may be null (key removed) → empty list.
      this.symbols.set(parseFavoriteSymbols(event.newValue));
    } catch {
      // Ignore malformed external events.
    }
  }

  static normalize(symbol: string | null | undefined): string {
    return (symbol || '').trim().toUpperCase();
  }
}
