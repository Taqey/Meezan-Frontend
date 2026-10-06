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
          <span class="nav-indicator" aria-hidden="true"></span>
          <a routerLink="/stocks" routerLinkActive="active" (click)="closeMenu()">الأسهم</a>
          <a routerLink="/indices" routerLinkActive="active" (click)="closeMenu()">المؤشرات</a>
          <a routerLink="/shariah-standards" routerLinkActive="active" (click)="closeMenu()">المعايير الشرعية</a>
          <a routerLink="/purification" routerLinkActive="active" (click)="closeMenu()">التطهير</a>
          <a routerLink="/favorites" routerLinkActive="active" (click)="closeMenu()">المفضلة <span class="nav-count" *ngIf="favCount > 0">{{ favCount }}</span></a>
        </nav>

        <div class="header-meta">
          <span class="live-dot"></span>
          <span>بيانات السوق مباشرة من البورصة المصرية</span>
        </div>

        <button class="menu-button" (click)="toggleMenu()" aria-label="فتح القائمة">
          <lucide-icon [img]="isMenuOpen ? XIcon : MenuIcon" size="20"></lucide-icon>
        </button>
      </div>
    </header>

    <main>
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
  `
})
export class PublicLayoutComponent implements AfterViewInit, OnDestroy {
  readonly LineChartIcon = LineChart;
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly SettingsIcon = Settings;
  readonly ShieldCheckIcon = ShieldCheck;

  isMenuOpen = false;

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
    this.resizeHandler = () => this.scheduleIndicatorUpdate();
    window.addEventListener('resize', this.resizeHandler);
    // Re-measure after fonts/layout settle so the indicator lands exactly.
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
    this.isMenuOpen = !this.isMenuOpen;
    this.scheduleIndicatorUpdate();
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  private scheduleIndicatorUpdate(): void {
    if (this.remeasureTimer !== null) clearTimeout(this.remeasureTimer);
    // Wait a frame (active link class + menu layout applied) before measuring.
    requestAnimationFrame(() => {
      this.updateIndicator();
      this.remeasureTimer = setTimeout(() => this.updateIndicator(), 250);
    });
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
