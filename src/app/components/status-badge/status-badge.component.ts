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
    return 'status-warn';
  }

  get label(): string {
    const s = (this.status || '').toLowerCase().replace(/[-_ ]/g, '');
    if (s === 'compliant' || s === 'متوافق') return 'متوافق';
    if (s === 'noncompliant' || s === 'غير متوافق') return 'غير متوافق';
    if (s === 'blocked') return 'محظور';
    if (s === 'pending') return 'قيد المراجعة';
    return this.status || 'غير محدد';
  }
}
