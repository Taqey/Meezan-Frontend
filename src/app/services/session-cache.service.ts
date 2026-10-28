import { Injectable } from '@angular/core';
import { Observable, of, tap, shareReplay } from 'rxjs';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessionCacheService {
  /** Default stale time: 3 minutes */
  readonly defaultStaleTimeMs = 3 * 60 * 1000;

  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Observable<any>>();
  private pageUiStates = new Map<string, any>();
  private scrollPositions = new Map<string, [number, number]>();

  get<T>(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key);
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  isStale(key: string, maxAgeMs = this.defaultStaleTimeMs): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > maxAgeMs;
  }

  /**
   * Stale-while-revalidate fetcher:
   * Returns an Observable of T. If cached, caller gets data or can check get(key).
   */
  fetch<T>(key: string, fetcher: () => Observable<T>): Observable<T> {
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key)!;
    }

    const obs = fetcher().pipe(
      tap({
        next: (data) => {
          this.set(key, data);
          this.inFlight.delete(key);
        },
        error: () => {
          this.inFlight.delete(key);
        }
      }),
      shareReplay(1)
    );

    this.inFlight.set(key, obs);
    return obs;
  }

  /** UI state persistence per page key */
  saveUiState<T>(pageKey: string, state: T): void {
    this.pageUiStates.set(pageKey, state);
  }

  getUiState<T>(pageKey: string): T | undefined {
    return this.pageUiStates.get(pageKey) as T | undefined;
  }

  /** Scroll position persistence */
  saveScroll(pageKey: string, x: number, y: number): void {
    this.scrollPositions.set(pageKey, [x, y]);
  }

  getScroll(pageKey: string): [number, number] | undefined {
    return this.scrollPositions.get(pageKey);
  }

  restoreScroll(pageKey: string): void {
    const pos = this.getScroll(pageKey);
    if (pos) {
      setTimeout(() => {
        window.scrollTo({ left: pos[0], top: pos[1], behavior: 'instant' as ScrollBehavior });
      }, 50);
    }
  }

  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
    this.pageUiStates.clear();
    this.scrollPositions.clear();
  }
}
