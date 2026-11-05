import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { Lock, LogIn, LineChart } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
})
export class AdminLoginComponent implements OnInit, OnDestroy {
  readonly LockIcon = Lock;
  readonly LogInIcon = LogIn;
  readonly LineChartIcon = LineChart;

  password = '';
  error = '';

  constructor(
    private auth: AdminAuthService,
    private router: Router,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.meta.addTag({ name: 'robots', content: 'noindex' });
    if (this.auth.isLoggedIn) {
      this.router.navigate(['/admin']);
    }
  }

  ngOnDestroy(): void {
    this.meta.removeTag("name='robots'");
  }

  login(event: Event): void {
    event.preventDefault();
    this.error = '';

    if (!this.auth.login(this.password)) {
      this.error = 'Invalid password.';
      return;
    }

    this.router.navigate(['/admin']);
  }
}
