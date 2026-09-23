import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  LineChart,
  Menu,
  X,
  ShieldCheck,
  Settings
} from 'lucide-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule
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
export class AppComponent {
  readonly LineChartIcon = LineChart;
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly SettingsIcon = Settings;
  readonly ShieldCheckIcon = ShieldCheck;

  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
