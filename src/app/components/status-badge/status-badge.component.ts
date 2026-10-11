import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <span class="status-badge" [ngClass]="badgeClass">
      <span class="status-dot"></span>
      {{ label }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status?: string | null;

  get badgeClass(): string {
    const s = (this.status || '').toLowerCase().replace(/[-_ ]/g, '');
    if (s === 'compliant' || s === 'متوافق') return 'status-good';
    if (s === 'noncompliant' || s === 'غير متوافق') return 'status-bad';
    // Insufficient data (Pending) is neutral — never green, never red.
    // Doubtful must never render: treat it as neutral insufficient too.
    return 'status-neutral';
  }

  get label(): string {
    const s = (this.status || '').toLowerCase().replace(/[-_ ]/g, '');
    if (s === 'compliant' || s === 'متوافق') return 'متوافق';
    if (s === 'noncompliant' || s === 'غير متوافق') return 'غير متوافق';
    if (s === 'blocked') return 'محظور';
    // Old "قيد المراجعة" is now "البيانات غير كافية". Doubtful/مشكوك never displays.
    if (s === 'pending') return 'البيانات غير كافية';
    if (s === 'doubtful' || (this.status || '').includes('مشكوك')) return 'البيانات غير كافية';
    return this.status || 'غير محدد';
  }
}
