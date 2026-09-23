import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Lock, LogIn, LineChart } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <section class="portal-login">
      <div class="login-panel">
        <div class="login-brand">
          <span class="brand-mark">
            <lucide-icon [img]="LineChartIcon" size="22"></lucide-icon>
          </span>
          <div>
            <strong>Meezan Admin</strong>
            <span>Operations Portal</span>
          </div>
        </div>

        <form (submit)="login($event)" class="login-form">
          <label>
            Admin password
            <span class="password-row">
              <lucide-icon [img]="LockIcon" size="18"></lucide-icon>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                autocomplete="current-password"
                placeholder="Enter password"
                required />
            </span>
          </label>

          <p *ngIf="error" class="form-error">{{ error }}</p>

          <button class="btn btn-primary" type="submit">
            <lucide-icon [img]="LogInIcon" size="16"></lucide-icon>
            Login
          </button>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .portal-login {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }
    .login-panel {
      width: 100%;
      max-width: 420px;
      background: var(--card, #ffffff);
      border: 1px solid var(--border, #e2e9e5);
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
    .login-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border, #e2e9e5);
    }
    .login-brand strong {
      display: block;
      font-size: 16px;
      color: var(--foreground, #17231f);
    }
    .login-brand span {
      font-size: 12px;
      color: var(--muted-foreground, #708078);
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .login-form label {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground, #17231f);
    }
    .password-row {
      display: flex;
      align-items: center;
      position: relative;
    }
    .password-row lucide-icon {
      position: absolute;
      right: 12px;
      color: var(--muted-foreground, #708078);
    }
    .password-row input {
      width: 100%;
      min-height: 44px;
      padding: 0 38px 0 14px;
      border: 1px solid var(--border, #e2e9e5);
      border-radius: 8px;
      font-size: 14px;
      background: #fafbfa;
      outline-color: var(--primary, #087f5b);
    }
    .form-error {
      color: var(--bad, #c8443d);
      background: var(--bad-soft, #f9e9e7);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      margin: 0;
    }
    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      min-height: 44px;
      background: var(--primary, #087f5b);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-primary:hover {
      background: #06694a;
    }
  `]
})
export class AdminLoginComponent {
  readonly LockIcon = Lock;
  readonly LogInIcon = LogIn;
  readonly LineChartIcon = LineChart;

  password = '';
  error = '';

  constructor(
    private auth: AdminAuthService,
    private router: Router
  ) {}

  login(event: Event): void {
    event.preventDefault();
    this.error = '';

    if (!this.auth.login(this.password)) {
      this.error = 'Invalid password.';
      return;
    }

    this.router.navigate(['/portal/dashboard']);
  }
}
