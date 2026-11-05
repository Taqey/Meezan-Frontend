import { AfterViewInit, Component, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, NavigationStart, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { FavoritesService } from '../../services/favorites.service';
import { SessionCacheService } from '../../services/session-cache.service';
import { ToastHostComponent } from '../../../shared/components/toast-host/toast-host.component';
import {
  LucideAngularModule,
  LineChart,
  Menu,
  X,
  ShieldCheck,
  Settings
} from 'lucide-angular';

/**
 * Public site shell: header + footer + navigation.
 * Wraps all public pages (home, stocks, indices, sectors, stock details).
 * Rendered via the '' parent route — visually identical to the previous AppComponent shell.
 */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    ToastHostComponent
  ],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css',
})
export class PublicLayoutComponent implements AfterViewInit, OnDestroy {
  readonly LineChartIcon = LineChart;
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly SettingsIcon = Settings;
  readonly ShieldCheckIcon = ShieldCheck;

  isMenuOpen = false;
  isDrawerOpen = false;

  readonly headerHeight = 64;

  private routerSub: Subscription | null = null;
  private resizeHandler: (() => void) | null = null;
  private remeasureTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollResetTimer: ReturnType<typeof setTimeout> | null = null;
  private lastNavTrigger: string | null = null;
  private lastNavPathname: string | null = typeof window !== 'undefined' ? (window.location.hash ? window.location.hash.slice(1).split('?')[0] : window.location.pathname) : null;

  constructor(
    readonly favorites: FavoritesService,
    private readonly cache: SessionCacheService,
    private readonly router: Router,
    private readonly host: ElementRef<HTMLElement>
  ) {}

  get favCount(): number {
    return this.favorites.count();
  }

  ngAfterViewInit(): void {
    // Disable browser built-in scroll restoration so it never fights our manual reset.
    if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    this.routerSub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.lastNavTrigger = e.navigationTrigger ?? null;
        this.onNavigationStart(e.navigationTrigger ?? '', e.url);
      }
      if (e instanceof NavigationEnd) {
        const newPathname = e.urlAfterRedirects.split('?')[0].split('#')[0];
        
        const pathnameChanged = newPathname !== this.lastNavPathname;
        const previousPathname = this.lastNavPathname;
        this.lastNavPathname = newPathname;

        // Reset scroll on every pathname change.
        // performScrollReset decides what to do based on trigger + direction:
        //  - non-popstate, non-back-from-child: scroll to 0
        //  - popstate or back-from-child: grant allowRestoreOnce so the
        //    component can restore its saved position
        // Skip query-param-only changes so filter/sort changes never jump to top.
        if (pathnameChanged) {
          if (this.scrollResetTimer !== null) clearTimeout(this.scrollResetTimer);
          // Run immediately so allowRestoreOnce / clearScroll is set BEFORE
          // the incoming component fetches data or calls restoreScroll.
          this.performScrollReset(previousPathname, newPathname);
        }
        this.scheduleIndicatorUpdate();
      }
    });
    this.resizeHandler = () => {
      if (window.innerWidth > 1024 && this.isDrawerOpen) {
        this.closeDrawer();
      }
      this.scheduleIndicatorUpdate();
    };
    window.addEventListener('resize', this.resizeHandler);
    this.scheduleIndicatorUpdate();
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => this.scheduleIndicatorUpdate()).catch(() => {});
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.routerSub = null;
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.remeasureTimer !== null) {
      clearTimeout(this.remeasureTimer);
      this.remeasureTimer = null;
    }
    if (this.scrollResetTimer !== null) {
      clearTimeout(this.scrollResetTimer);
      this.scrollResetTimer = null;
    }
  }

  toggleMenu(): void {
    this.toggleDrawer();
  }

  closeMenu(): void {
    this.closeDrawer();
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
    this.isMenuOpen = this.isDrawerOpen;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.isMenuOpen = false;
  }


  /** Maps list route paths to their corresponding SessionCache scroll keys. */
  private readonly listRouteKeys: Record<string, string> = {
    '/stocks': 'stocks-list',
    '/funds': 'funds-list',
    '/indices': 'indices-list',
    '/indices/Sectoral-Indices': 'sectors-list',
    '/sectors': 'sectors-list'
  };

  /**
   * Returns true only when navigating to a list page from one of its own detail child pages,
   * in which case the saved scroll position should be restored instead of reset to 0.
   */
  private isBackNavFromOwnDetail(prevPath: string | null, nextPath: string): boolean {
    if (!prevPath) return false;
    const p = prevPath.replace(/\/+$/, '');
    const n = nextPath.replace(/\/+$/, '');
    if (n === '/stocks' && p.startsWith('/stocks/')) return true;
    if (n === '/funds' && (p.startsWith('/funds/') || p.startsWith('/fund-managers/'))) return true;
    if (n === '/indices' && p.startsWith('/indices/') && !p.startsWith('/indices/Sectoral-Indices')) return true;
    if ((n === '/indices/Sectoral-Indices' || n === '/sectors') && (p.startsWith('/indices/Sectoral-Indices/') || p.startsWith('/sectors/'))) return true;
    return false;
  }

  /**
   * Called on NavigationStart so we can mark a list key as save-prevented BEFORE
   * the old component's ngOnDestroy fires (which happens during the navigation).
   */
  private onNavigationStart(trigger: string, destUrl: string): void {
    if (trigger === 'popstate') return; // back/forward — never prevent save
    const destPathname = destUrl.split('?')[0].split('#')[0];
    const leavingPath = this.lastNavPathname;
    if (!leavingPath) return;
    const leavingKey = this.listRouteKeys[leavingPath.replace(/\/+$/, '')];
    if (!leavingKey) return; // not leaving a list page — nothing to lock

    // If destination pathname equals current pathname, this is a query-param-only
    // navigation (e.g. filter/sort changes). Do NOT prevent save or reset anything!
    if (destPathname === leavingPath) {
      return;
    }

    // Check if we are going INTO one of the child detail pages of the leaving list.
    // In that case we WANT ngOnDestroy to save the scroll position so back-nav can restore it.
    const goingIntoOwnChild = this.isGoingIntoOwnDetail(leavingPath, destPathname);
    if (!goingIntoOwnChild) {
      // Leaving via navbar or going to an unrelated page — prevent ngOnDestroy
      // from re-saving a stale position after clearScroll() runs later.
      this.cache.preventSaveOnce(leavingKey);
    }
  }

  /**
   * Returns true when navigating FROM a list page INTO one of its own detail child pages.
   * (Opposite direction of isBackNavFromOwnDetail.)
   */
  private isGoingIntoOwnDetail(leavingPath: string, destPath: string): boolean {
    const l = leavingPath.replace(/\/+$/, '');
    const d = destPath.replace(/\/+$/, '');
    if (l === '/stocks' && d.startsWith('/stocks/')) return true;
    if (l === '/funds' && (d.startsWith('/funds/') || d.startsWith('/fund-managers/'))) return true;
    if (l === '/indices' && d.startsWith('/indices/') && !d.startsWith('/indices/Sectoral-Indices')) return true;
    if ((l === '/indices/Sectoral-Indices' || l === '/sectors') && (d.startsWith('/indices/Sectoral-Indices/') || d.startsWith('/sectors/'))) return true;
    return false;
  }

  /**
   * Clears saved scroll position if navigating to a list page from outside (e.g. navbar),
   * and scrolls window instantly to (0, 0) across consecutive animation frames.
   * When navigating back from a child detail page, grants restoreScroll permission.
   */
  private performScrollReset(prevPath: string | null, nextPath: string): void {
    const listKey = this.listRouteKeys[nextPath.replace(/\/+$/, '')];
    const isBackFromChild = this.isBackNavFromOwnDetail(prevPath, nextPath);
    const isPopstate = this.lastNavTrigger === 'popstate';

    if (listKey && isBackFromChild) {
      // Back from a child detail page (via navbar back button OR popstate):
      // grant the list component permission to restore saved scroll position.
      this.cache.allowRestoreOnce(listKey);
    } else if (listKey && !isBackFromChild && !isPopstate) {
      // Forward/navbar navigation to a list page: clear the saved position
      // so stale scrolls never resurface.
      this.cache.clearScroll(listKey);
    }

    // Only scroll to top on explicit forward navigations (not popstate back/forward).
    if (!isBackFromChild && !isPopstate) {
      const resetScroll = () => {
        window.scrollTo({ left: 0, top: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      resetScroll();
      requestAnimationFrame(() => {
        resetScroll();
        requestAnimationFrame(resetScroll);
      });
    }
  }

  private scheduleIndicatorUpdate(): void {
    if (this.remeasureTimer !== null) clearTimeout(this.remeasureTimer);
    this.remeasureTimer = setTimeout(() => this.updateIndicator(), 0);
  }

  /**
   * Slides the underline indicator under the active tab (transform/width only).
   * Physical pixels work in both directions, so RTL needs no special casing.
   */
  private updateIndicator(): void {
    const root = this.host.nativeElement;
    const bar = root.querySelector<HTMLElement>('.nav-indicator');
    const nav = root.querySelector<HTMLElement>('.nav-links');
    const active = root.querySelector<HTMLElement>('.nav-links a.active');
    if (!bar || !nav || !active) {
      bar?.classList.remove('on');
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const linkRect = active.getBoundingClientRect();
    if (linkRect.width <= 0) {
      bar.classList.remove('on');
      return;
    }
    const x = linkRect.left - navRect.left;
    const y = linkRect.bottom - navRect.top - 2;
    bar.style.transform = `translate(${x}px, ${y}px)`;
    bar.style.width = `${linkRect.width}px`;
    bar.classList.add('on');
  }
}