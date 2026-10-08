import { AfterViewInit, Component, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { FavoritesService } from '../../services/favorites.service';
import { ToastHostComponent } from '../../components/toast-host/toast-host.component';
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
  template: `
    <header class="site-header">
      <div class="nav-shell">
        <a routerLink="/" class="brand">
          <span class="brand-mark">
            <lucide-icon [img]="LineChartIcon" size="21"></lucide-icon>
          </span>
          <span>
            <strong>ميزان</strong>
            <small>EGX</small>
          </span>
        </a>

        <nav class="nav-links" [class.is-open]="isMenuOpen" aria-label="التنقل الرئيسي">
          <a routerLink="/stocks" routerLinkActive="active" (click)="closeMenu()">الأسهم</a>
          <a routerLink="/indices" routerLinkActive="active" (click)="closeMenu()">المؤشرات</a>
          <a routerLink="/shariah-standards" routerLinkActive="active" (click)="closeMenu()">المعايير الشرعية</a>
          <a routerLink="/purification" routerLinkActive="active" (click)="closeMenu()">التطهير</a>
        </nav>

        <div class="header-meta">
          <span class="live-dot"></span>
          <span>بيانات السوق مباشرة من البورصة المصرية</span>
        </div>

        <button class="menu-button" (click)="toggleDrawer()" aria-label="فتح القائمة" [attr.aria-expanded]="isDrawerOpen">
          <lucide-icon [img]="isDrawerOpen ? XIcon : MenuIcon" size="20"></lucide-icon>
        </button>
      </div>
    </header>

    <button class="drawer-scrim" *ngIf="isDrawerOpen" (click)="closeDrawer()" aria-hidden="true" aria-label="إغلاق القائمة" [class.visible]="isDrawerOpen"></button>

    <aside class="drawer" [class.open]="isDrawerOpen" aria-label="القائمة الجانبية" role="dialog" aria-modal="true">
      <nav class="drawer-nav" aria-label="القائمة الجانبية">
        <a routerLink="/stocks" routerLinkActive="active" (click)="closeDrawer()">الأسهم</a>
        <a routerLink="/indices" routerLinkActive="active" (click)="closeDrawer()">المؤشرات</a>
        <a routerLink="/shariah-standards" routerLinkActive="active" (click)="closeDrawer()">المعايير الشرعية</a>
        <a routerLink="/purification" routerLinkActive="active" (click)="closeDrawer()">التطهير</a>
      </nav>
    </aside>

    <main class="main-content" [style.padding-top.px]="headerHeight">
      <router-outlet></router-outlet>
    </main>

    <app-toast-host></app-toast-host>

    <footer>
      <div class="footer-shell">
        <a routerLink="/" class="brand">
          <span class="brand-mark">
            <lucide-icon [img]="LineChartIcon" size="21"></lucide-icon>
          </span>
          <span>
            <strong>ميزان</strong>
            <small>EGX</small>
          </span>
        </a>
        <span>تغطية متكاملة لـ 8 هيئات شرعية · 4 نماذج للقيمة العادلة · متصل بخادم Meezan Backend</span>
        <span>© 2026 ميزان EGX</span>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    .site-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: rgba(247, 248, 246, 0.92);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(14px);
    }

    .nav-shell {
      max-width: 1180px;
      margin: 0 auto;
      padding: 0 16px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--ink);
      direction: ltr;
    }

    .brand-mark {
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--primary);
      color: white;
    }

    .brand strong {
      display: block;
      font-size: 17px;
      line-height: 18px;
      direction: rtl;
    }

    .brand small {
      color: var(--primary);
      letter-spacing: .16em;
      font-size: 10px;
      display: block;
      direction: ltr;
      text-align: right;
      font-weight: 700;
    }

    .nav-links {
      display: flex;
      gap: 16px;
      color: var(--muted-foreground);
      font-size: 14px;
      font-weight: 500;
    }

    .nav-links a {
      padding: 8px 0;
      transition: color 0.2s ease;
    }

    .nav-links a:hover,
    .nav-links a.active {
      color: var(--primary);
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--muted-foreground);
      font-size: 11px;
    }

    .menu-button {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.94);
  color: var(--foreground);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(23, 35, 31, 0.1);
  transition: all 0.2s ease;
}

    .menu-button:hover {
      background: var(--secondary);
      border-color: var(--primary);
      color: var(--primary);
    }

    /* Drawer scrim */
    .drawer-scrim {
      position: fixed;
      inset: 0;
      background: rgba(23, 35, 31, 0.35);
      z-index: 90;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease;
    }

    .drawer-scrim.visible {
      opacity: 1;
      visibility: visible;
    }

    /* Drawer sidebar */
    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 280px;
      max-width: 85vw;
      background: var(--card);
      border-inline-start: 1px solid var(--border);
      box-shadow: 0 0 40px rgba(23, 35, 31, 0.12);
      z-index: 100;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    }

    [dir="ltr"] .drawer {
      left: 0;
      right: auto;
    }

    .drawer.open {
      transform: translateX(0);
    }

    .drawer-nav {
      display: flex;
      flex-direction: column;
      padding: 24px 20px;
      gap: 8px;
      height: 100%;
      overflow-y: auto;
    }

    .drawer-nav a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 500;
      color: var(--foreground);
      text-decoration: none;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .drawer-nav a:hover {
      background: var(--secondary);
      color: var(--primary);
    }

    .drawer-nav a.active {
      background: var(--primary);
      color: white;
    }

    /* Main content */
    .main-content {
      padding-top: 64px;
      min-height: 100vh;
    }

    @media (max-width: 1024px) {
      .nav-links {
        display: none;
      }
      .header-meta {
        display: none;
      }
      .menu-button {
        display: inline-flex;
      }
    }

    @media (max-width: 600px) {
      .nav-shell {
        gap: 8px;
        padding: 0 12px;
      }
      .brand strong {
        font-size: 15px;
      }
      .menu-button {
        width: 36px;
        height: 36px;
      }
    }
  `]
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

  constructor(
    readonly favorites: FavoritesService,
    private readonly router: Router,
    private readonly host: ElementRef<HTMLElement>
  ) {}

  get favCount(): number {
    return this.favorites.count();
  }

  ngAfterViewInit(): void {
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.scheduleIndicatorUpdate());
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