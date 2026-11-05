import { Component, OnDestroy, OnInit } from '@angular/core';
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
  Layers,
  PiggyBank,
  type LucideIconData
} from 'lucide-angular';
import { AdminAuthService } from '../../auth/admin-auth.service';
import { ToastHostComponent } from '../../../shared/components/toast-host/toast-host.component';

interface AdminNavItem {
  path: string;
  label: string;
  icon: LucideIconData;
}

/**
 * Standalone admin portal shell: hamburger drawer + top bar + content outlet.
 * The sidebar is always a hidden drawer revealed via the hamburger button --
 * identical mechanism to the public layout. Adds a robots=noindex tag while
 * mounted so admin pages are never indexed.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    ToastHostComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  readonly LineChartIcon = LineChart;
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly LogOutIcon = LogOut;
  readonly BackIcon = ArrowLeft;

  readonly navItems: AdminNavItem[] = [
    { path: 'market-data', label: 'سحب بيانات السوق (Live & Quarterly)', icon: Database },
    { path: 'manual-edit', label: 'تعديل بيانات السوق يدوياً', icon: Edit3 },
    { path: 'shariah-edit', label: 'تعديل البيانات الشرعية', icon: ShieldCheck },
    { path: 'index-files', label: 'رفع ملفات المؤشرات (Excel)', icon: Upload },
    { path: 'shariah-seed', label: 'تحديث وبذر بيانات الشريعة', icon: ShieldCheck },
    { path: 'shariah-reports', label: 'رفع تقارير فيصل/أسطول (PDF)', icon: FileText },
    { path: 'review-queue', label: 'قائمة المراجعة', icon: ClipboardCheck },
    { path: 'stocks', label: 'إدارة الأسهم والقطاعات والمؤشرات', icon: Layers },
    { path: 'funds', label: 'إدارة الصناديق', icon: PiggyBank }
  ];

  pageTitle = 'لوحة الإدارة';
  pageSubtitle = '';
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
    this.resizeHandler = () => {
      if (this.drawerOpen) {
        this.closeDrawer();
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    this.meta.removeTag("name='robots'");
    this.routerSub?.unsubscribe();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  toggleDrawer(): void {
    this.drawerOpen = !this.drawerOpen;
    document.body.style.overflow = this.drawerOpen ? 'hidden' : '';
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
