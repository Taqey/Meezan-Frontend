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

  /**
   * Keys in this set have been explicitly allowed to restore once.
   * Set by the layout when a back-from-child navigation is detected.
   * Consumed (removed) by restoreScroll() on first call, so it fires exactly once.
   */
  private restoreAllowed = new Set<string>();

  /**
   * Keys in this set must not have their scroll position saved.
   * Set by the layout immediately when navigating away from a list page via navbar
   * (non-back navigation), so that ngOnDestroy cannot overwrite a position that was
   * already cleared.  Cleared after a short grace period.
   */
  private savePrevented = new Set<string>();
  private savePreventTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
    // If the layout has flagged this key as save-prevented (navbar departure),
    // silently drop the save so ngOnDestroy cannot overwrite a cleared position.
    if (this.savePrevented.has(pageKey)) {
      return;
    }
    this.scrollPositions.set(pageKey, [x, y]);
  }

  getScroll(pageKey: string): [number, number] | undefined {
    return this.scrollPositions.get(pageKey);
  }

  clearScroll(pageKey: string): void {
    this.scrollPositions.delete(pageKey);
  }

  /**
   * Called by the layout on NavigationStart when the source page is a list page
   * and the navigation is NOT back-from-own-detail (i.e. a navbar departure).
   *
   * Prevents ngOnDestroy of that list page from re-saving a stale position after
   * clearScroll() has already been called.  The prevention expires after 2 s
   * (well after any ngOnDestroy can fire).
   */
  preventSaveOnce(pageKey: string): void {
    // Cancel any existing expiry timer
    const existing = this.savePreventTimers.get(pageKey);
    if (existing != null) clearTimeout(existing);

    this.savePrevented.add(pageKey);
    // Auto-expire after 2 000 ms — long enough for ngOnDestroy but short enough
    // not to block legitimate saves later.
    const t = setTimeout(() => {
      this.savePrevented.delete(pageKey);
      this.savePreventTimers.delete(pageKey);
    }, 2000);
    this.savePreventTimers.set(pageKey, t);
  }

  /**
   * Called by the layout before NavigationEnd when it detects a back-from-child
   * navigation.  Marks the key as allowed to restore exactly once.
   * restoreScroll() will consume this permission and become a no-op afterwards.
   */
  allowRestoreOnce(pageKey: string): void {
    this.restoreAllowed.add(pageKey);
  }

  /**
   * Restores scroll position for pageKey.
   * ONLY works if allowRestoreOnce(pageKey) was called first by the layout.
   * Without that gate it is a deliberate no-op, so stale positions saved by
   * ngOnDestroy can never resurface on a plain navbar navigation.
   */
  restoreScroll(pageKey: string): void {
    if (!this.restoreAllowed.has(pageKey)) {
      // No permission granted by the layout — do nothing.
      return;
    }
    // Consume the permission (fire exactly once).
    this.restoreAllowed.delete(pageKey);

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
    this.restoreAllowed.clear();
    this.savePrevented.clear();
    this.savePreventTimers.forEach(t => clearTimeout(t));
    this.savePreventTimers.clear();
  }
}
