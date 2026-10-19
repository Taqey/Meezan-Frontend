import { Injectable, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, RoutesRecognized } from '@angular/router';
import { Location } from '@angular/common';

export interface SavedScrollState {
  scrollY: number;
  docHeight: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ScrollRestorationService {
  private router = inject(Router);
  private location = inject(Location);

  private lastUrl: string | null = null;
  private lastPath: string | null = null;
  private lastTrigger: 'imperative' | 'popstate' | 'hashchange' | null = null;
  private isSameRouteQueryChange = false;
  private restoreAbortController: AbortController | null = null;

  private readonly storagePrefix = 'meezan_scroll_pos:';

  constructor() {
    this.init();
  }

  private init(): void {
    // Save scroll on page hide or unload as safety
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.saveCurrentPosition());
    }

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.saveCurrentPosition();
        this.lastTrigger = (event.navigationTrigger as any) ?? 'imperative';

        // Check if this navigation is a query-param-only change on the same primary path
        const targetUrlTree = this.router.parseUrl(event.url);
        const targetPath = this.extractPath(targetUrlTree);

        const currentUrlTree = this.router.parseUrl(this.router.url);
        const currentPath = this.extractPath(currentUrlTree);

        this.isSameRouteQueryChange = (currentPath === targetPath) && (this.lastTrigger !== 'popstate');
      } else if (event instanceof NavigationEnd) {
        this.handleNavigationEnd(event.urlAfterRedirects || event.url);
      }
    });
  }

  private extractPath(tree: any): string {
    const primary = tree.root.children['primary'];
    if (!primary) return '';
    return '/' + primary.segments.map((s: any) => s.path).join('/');
  }

  public saveCurrentPosition(): void {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;
    const currentUrl = this.router.url;
    if (!currentUrl) return;

    const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;

    const state: SavedScrollState = {
      scrollY,
      docHeight,
      timestamp: Date.now()
    };

    try {
      // Store under full URL key and current history state if present
      sessionStorage.setItem(this.storagePrefix + currentUrl, JSON.stringify(state));
      const pathOnly = this.extractPath(this.router.parseUrl(currentUrl));
      if (pathOnly) {
        sessionStorage.setItem(this.storagePrefix + 'path:' + pathOnly, JSON.stringify(state));
      }
    } catch {
      // Ignore quota errors
    }
  }

  public getSavedPosition(url: string): SavedScrollState | null {
    if (typeof sessionStorage === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(this.storagePrefix + url);
      if (raw) return JSON.parse(raw);

      // Fallback by path
      const pathOnly = this.extractPath(this.router.parseUrl(url));
      const rawPath = sessionStorage.getItem(this.storagePrefix + 'path:' + pathOnly);
      if (rawPath) return JSON.parse(rawPath);
    } catch {
      return null;
    }
    return null;
  }

  private handleNavigationEnd(targetUrl: string): void {
    if (typeof window === 'undefined') return;

    if (this.restoreAbortController) {
      this.restoreAbortController.abort();
      this.restoreAbortController = null;
    }

    if (this.isSameRouteQueryChange) {
      // Rule 1: Query-param-only changes on the same route never reset scroll position!
      return;
    }

    if (this.lastTrigger === 'popstate') {
      // Rule 4: Back/forward restoration
      const saved = this.getSavedPosition(targetUrl);
      if (saved && saved.scrollY > 0) {
        this.restorePositionWithRetry(saved.scrollY, saved.docHeight);
        return;
      }
    }

    // Rule 3: Forward navigation to another route starts at the top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  public restorePositionWithRetry(targetY: number, savedDocHeight: number, maxWaitMs = 3000): void {
    if (typeof window === 'undefined') return;

    this.restoreAbortController = new AbortController();
    const signal = this.restoreAbortController.signal;
    const startTime = performance.now();

    const attempt = () => {
      if (signal.aborted) return;

      const currentHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
      const clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const maxScrollY = Math.max(0, currentHeight - clientHeight);

      // If document is tall enough to reach targetY, scroll immediately
      if (currentHeight >= savedDocHeight || maxScrollY >= targetY) {
        window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = targetY;
        document.body.scrollTop = targetY;
        return;
      }

      // Check timeout
      if (performance.now() - startTime >= maxWaitMs) {
        // Fallback: ratio
        let finalY = targetY;
        if (savedDocHeight > clientHeight && currentHeight > clientHeight) {
          const ratio = targetY / (savedDocHeight - clientHeight);
          finalY = Math.round(ratio * (currentHeight - clientHeight));
        } else {
          finalY = Math.min(targetY, maxScrollY);
        }
        window.scrollTo({ top: finalY, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = finalY;
        document.body.scrollTop = finalY;
        return;
      }

      // Otherwise wait for next animation frame
      requestAnimationFrame(attempt);
    };

    requestAnimationFrame(attempt);
  }

  /**
   * Helper for in-app back controls:
   * Behaves like browser back (history back if previous entry was the list),
   * otherwise navigates to fallbackUrl while preserving scroll restoration.
   */
  public navigateBack(fallbackUrl: string): void {
    if (typeof window === 'undefined') {
      this.router.navigateByUrl(fallbackUrl);
      return;
    }

    // If there is browser history in session, use window.history.back()
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl(fallbackUrl);
    }
  }

  /**
   * Scrolls smoothly to the results grid header/container for pagination
   */
  public scrollToGrid(selector = '.results-head, .entity-grid, .stock-grid'): void {
    if (typeof document === 'undefined') return;
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
