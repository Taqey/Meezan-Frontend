import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

const ADMIN_SESSION_KEY = 'meezan_admin_session';
const ADMIN_PASSWORD = 'admin123';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  constructor(private router: Router) {}

  get isLoggedIn(): boolean {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  }

  login(password: string): boolean {
    if (password !== ADMIN_PASSWORD) {
      return false;
    }

    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    return true;
  }

  logout(): void {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    this.router.navigate(['/portal/login']);
  }
}
