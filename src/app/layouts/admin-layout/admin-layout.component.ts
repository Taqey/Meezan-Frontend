import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { filter, Subscription } from 'rxjs';
import {
  LucideAngularModule,
  LineChart,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  Database,
  Edit3,
  Upload,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  ChevronRight,
  type LucideIconData
} from 'lucide-angular';
import { AdminAuthService } from '../../services/admin-auth.service';

interface AdminNavItem {
  path: string;
  label: string;
  icon: LucideIconData;
}

/**
 * Standalone admin portal shell: sidebar + top bar + content outlet.
 * Contains NO public header and NO public footer.
 * Rendered via the lazy-loaded 'admin' route tree (guarded), one child route
 * per operations section. Adds a robots=noindex tag while mounted so admin
 * pages are never indexed.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule
  ],
  template: `
    <div class="admin-shell" [class.sidebar-collapsed]="sidebarCollapsed">
      <div class="drawer-scrim" *ngIf="drawerOpen" (click)="closeDrawer()"></div>

      <aside class="admin-sidebar" [class.drawer-open]="drawerOpen" aria-label="لوحة الإدارة">
        <div class="sidebar-brand">
          <span class="brand-mark">
            <lucide-icon [img]="LineChartIcon" size="20"></lucide-icon>
          </span>
          <span class="brand-text">
            <strong>Meezan Admin</strong>
            <small>Operations Portal</small>
          </span>
        </div>

        <nav class="sidebar-nav" aria-label="أقسام الإدارة">
          <a *ngFor="let item of navItems"
             [routerLink]="item.path"
             routerLinkActive="active"
             (click)="closeDrawer()"
             class="sidebar-link">
            <lucide-icon [img]="item.icon" size="17"></lucide-icon>
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/" class="sidebar-link back-link">
            <lucide-icon [img]="BackIcon" size="17"></lucide-icon>
            <span>Back to site</span>
          </a>
          <button class="sidebar-link logout-link" (click)="logout()">
            <lucide-icon [img]="LogOutIcon" size="17"></lucide-icon>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div class="drawer-scrim" [class.visible]="drawerOpen" *ngIf="drawerOpen" (click)="closeDrawer()" aria-hidden="true" aria-label="إغلاق القائمة"></div>

      <div class="admin-main">
        <div class="admin-topbar">
          <button class="menu-button" (click)="toggleDrawer()" aria-label="فتح قائمة الإدارة">
            <lucide-icon [img]="drawerOpen ? XIcon : MenuIcon" size="20"></lucide-icon>
          </button>
          <button class="collapse-button" (click)="toggleSidebar()" aria-label="طي القائمة الجانبية">
            <lucide-icon [img]="CollapseIcon" size="18"></lucide-icon>
          </button>
          <div class="topbar-titles">
            <strong>{{ pageTitle }}</strong>
            <small *ngIf="pageSubtitle">{{ pageSubtitle }}</small>
          </div>
          <div class="topbar-actions">
            <button class="btn btn-outline" (click)="logout()">
              <lucide-icon [img]="LogOutIcon" size="15"></lucide-icon>
              Logout
            </button>
          </div>
        </div>

        <div class="admin-content">
          <div class="admin-content-inner">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      min-height: 100vh;
      min-height: 100dvh;
      background: var(--background, #f4f6f4);
    }
    .admin-sidebar {
      width: 264px;
      flex-shrink: 0;
      background: var(--card, #ffffff);
      border-inline-end: 1px solid var(--border, #e2e9e5);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      height: 100dvh;
      z-index: 40;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 18px;
      border-bottom: 1px solid var(--border, #e2e9e5);
    }
    .sidebar-brand .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--primary, #087f5b);
      color: #fff;
      flex-shrink: 0;
    }
    .sidebar-brand .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    .sidebar-brand strong {
      font-size: 15px;
      color: var(--foreground, #17231f);
    }
    .sidebar-brand small {
      font-size: 11px;
      color: var(--muted-foreground, #708078);
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 14px 12px;
      overflow-y: auto;
      flex: 1;
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 500;
      color: var(--foreground, #17231f);
      text-decoration: none;
      border: 1px solid transparent;
      background: transparent;
      cursor: pointer;
      width: 100%;
      font-family: inherit;
      text-align: start;
    }
    .sidebar-link:hover {
      background: #f2f6f3;
    }
    .sidebar-link.active {
      background: var(--good-soft, #e4f4ed);
      color: var(--primary, #087f5b);
      border-color: var(--border, #e2e9e5);
      font-weight: 700;
    }
    .sidebar-footer {
      border-top: 1px solid var(--border, #e2e9e5);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .back-link {
      color: var(--muted-foreground, #708078);
    }
    .logout-link {
      color: var(--bad, #c8443d);
    }
    .logout-link:hover {
      background: var(--bad-soft, #f9e9e7);
    }
    .admin-main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .admin-topbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 24px;
      background: var(--card, #ffffff);
      border-bottom: 1px solid var(--border, #e2e9e5);
      position: sticky;
      top: 0;
      z-index: 30;
    }
    .topbar-titles {
      display: flex;
      flex-direction: column;
      line-height: 1.35;
      flex: 1;
      min-width: 0;
    }
    .topbar-titles strong {
      font-size: 16px;
      color: var(--foreground, #17231f);
    }
    .topbar-titles small {
      font-size: 12px;
      color: var(--muted-foreground, #708078);
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .menu-button {
      display: none;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 10px;
      border: 1px solid var(--border, #e2e9e5);
      background: var(--card, #ffffff);
      cursor: pointer;
      color: var(--foreground, #17231f);
    }
    .collapse-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      border: 1px solid var(--border, #e2e9e5);
      background: var(--card, #ffffff);
      cursor: pointer;
      color: var(--muted-foreground, #708078);
    }

    /* Mobile sidebar drawer */
    .drawer-scrim {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      z-index: 35;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
    }

    .drawer-scrim.visible {
      opacity: 1;
      visibility: visible;
    }
    .admin-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    @media (max-width: 600px) {
      .admin-content {
        padding: 16px;
      }
      .admin-topbar {
        padding: 12px 16px;
      }
    }
    .admin-content-inner {
      max-width: 1200px;
      margin: 0 auto;
    }
    .drawer-scrim {
      display: none;
    }
    /* Collapsed (desktop icon rail) */
    .admin-shell.sidebar-collapsed .admin-sidebar {
      width: 76px;
    }
    .admin-shell.sidebar-collapsed .sidebar-brand {
      justify-content: center;
      padding: 20px 10px;
    }
    .admin-shell.sidebar-collapsed .brand-text,
    .admin-shell.sidebar-collapsed .sidebar-link span {
      display: none;
    }
    .admin-shell.sidebar-collapsed .sidebar-link {
      justify-content: center;
    }
    @media (max-width: 1024px) {
      .menu-button {
        display: inline-flex;
      }
      .collapse-button {
        display: none;
      }
      .admin-sidebar {
        position: fixed;
        inset-block: 0;
        inset-inline-end: 0;
        transform: translateX(105%);
        transition: transform 0.25s ease;
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.12);
      }
      [dir="ltr"] .admin-sidebar {
        transform: translateX(-105%);
      }
      .admin-sidebar.drawer-open {
        transform: translateX(0);
      }
      .admin-shell.sidebar-collapsed .admin-sidebar {
        width: 264px;
      }
      .admin-shell.sidebar-collapsed .admin-sidebar {
        width: 264px;
      }
      .admin-shell.sidebar-collapsed .sidebar-brand {
        justify-content: center;
        padding: 20px 10px;
      }
      .admin-shell.sidebar-collapsed .brand-text,
      .admin-shell.sidebar-collapsed .sidebar-link span {
        display: none;
      }
      .admin-shell.sidebar-collapsed .sidebar-link {
        justify-content: center;
      }
      .admin-shell.sidebar-collapsed .sidebar-brand {
        justify-content: flex-start;
        padding: 20px 18px;
      }
      .drawer-scrim {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        z-index: 35;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease, visibility 0.2s ease;
      }
      .drawer-scrim.visible {
        opacity: 1;
        visibility: visible;
      }
      .admin-content {
        padding: 16px;
      }
      .topbar-actions .btn {
        padding: 8px 12px;
        font-size: 13px;
      }
    }
  `]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  readonly LineChartIcon = LineChart;
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly LogOutIcon = LogOut;
  readonly BackIcon = ArrowLeft;
  readonly CollapseIcon = ChevronRight;

  readonly navItems: AdminNavItem[] = [
    { path: 'market-data', label: 'سحب بيانات السوق (Live & Quarterly)', icon: Database },
    { path: 'manual-edit', label: 'تعديل بيانات السوق يدوياً', icon: Edit3 },
    { path: 'index-files', label: 'رفع ملفات المؤشرات (Excel)', icon: Upload },
    { path: 'shariah-seed', label: 'تحديث وبذر بيانات الشريعة', icon: ShieldCheck },
    { path: 'shariah-reports', label: 'رفع تقارير فيصل/أسطول (PDF)', icon: FileText },
    { path: 'review-queue', label: 'قائمة المراجعة', icon: ClipboardCheck }
  ];

  pageTitle = 'لوحة الإدارة';
  pageSubtitle = '';
  sidebarCollapsed = false;
  drawerOpen = false;

  private routerSub?: Subscription;
  private resizeHandler: (() => void) | null = null;

  constructor(
    private readonly auth: AdminAuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly meta: Meta
  ) {}

  ngOnInit(): void {
    this.meta.addTag({ name: 'robots', content: 'noindex' });
    this.updateTitles();
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updateTitles();
        this.closeDrawer();
      });
    this.resizeHandler = () => this.updateDrawerState();
    window.addEventListener('resize', this.resizeHandler);
    this.updateDrawerState();
  }

  ngOnDestroy(): void {
    this.meta.removeTag("name='robots'");
    this.routerSub?.unsubscribe();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  private updateDrawerState(): void {
    if (this.drawerOpen) {
      this.closeDrawer();
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleDrawer(): void {
    this.drawerOpen = !this.drawerOpen;
    if (this.drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    document.body.style.overflow = '';
  }

  logout(): void {
    this.auth.logout();
  }

  private updateTitles(): void {
    let deepest = this.route.snapshot;
    while (deepest.firstChild) deepest = deepest.firstChild;
    const data = deepest.data;
    this.pageTitle = data['title'] || 'لوحة الإدارة';
    this.pageSubtitle = data['subtitle'] || '';
  }
}
