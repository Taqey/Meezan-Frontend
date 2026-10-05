/**
 * Favorites persistence behind a tiny adapter interface.
 *
 * Today favorites live in the browser (per device, no login). The UI only
 * talks to FavoritesService, which only talks to FavoritesStorageAdapter —
 * so a future backend store can replace the local one without touching
 * any component.
 *
 * TODO (cloud sync, do NOT build yet): when user accounts exist, add a
 * backend table (user_id, symbol, created_at) with an HttpFavoritesAdapter
 * implementing this same interface, and merge the server list with the
 * local list on login (union by symbol, server wins on conflict).
 */

/** Versioned key: bump the suffix if the stored shape ever changes. */
export const FAVORITES_STORAGE_KEY = 'meezan:favorites:v1';

/**
 * Minimal get/set contract. Implementations throw when the backing store
 * is unavailable (private mode, quota exceeded, disabled) so callers can
 * fall back to in-memory state for the session.
 */
export interface FavoritesStorageAdapter {
  /** Returns the raw stored string, or null when nothing was stored yet. */
  readRaw(key: string): string | null;
  /** Persists the raw string. Throws when the store is unavailable. */
  writeRaw(key: string, value: string): void;
}

/** Browser localStorage implementation. */
export class LocalStorageFavoritesAdapter implements FavoritesStorageAdapter {
  readRaw(key: string): string | null {
    return window.localStorage.getItem(key);
  }

  writeRaw(key: string, value: string): void {
    window.localStorage.setItem(key, value);
  }
}

/** In-memory fallback (also handy for unit tests). Never throws. */
export class InMemoryFavoritesAdapter implements FavoritesStorageAdapter {
  private readonly store = new Map<string, string>();

  /** Test hook: pre-seed a raw value. */
  seedRaw(key: string, value: string | null): void {
    if (value === null) {
      this.store.delete(key);
    } else {
      this.store.set(key, value);
    }
  }

  readRaw(key: string): string | null {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  writeRaw(key: string, value: string): void {
    this.store.set(key, value);
  }
}

/** Adapter that always throws — simulates unavailable storage (tests). */
export class UnavailableFavoritesAdapter implements FavoritesStorageAdapter {
  readRaw(): string | null {
    throw new Error('storage unavailable');
  }

  writeRaw(): void {
    throw new Error('storage unavailable');
  }
}

/** Parse + validate a raw payload. Never throws: garbage → empty list. */
export function parseFavoriteSymbols(raw: string | null): string[] {
  if (raw === null || raw === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: string[] = [];
    for (const entry of parsed) {
      if (typeof entry === 'string') {
        const symbol = entry.trim().toUpperCase();
        if (symbol && !out.includes(symbol)) out.push(symbol);
      }
    }
    return out;
  } catch {
    return [];
  }
}
