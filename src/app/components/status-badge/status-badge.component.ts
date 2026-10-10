import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SCHOLARS_COMPLIANT_VERDICT } from '../../models/shariah-standards';

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
    // Scholars compliant: amber/warn (compliant with caveats)
    if (this.status === SCHOLARS_COMPLIANT_VERDICT) return 'status-warn';
    return 'status-warn';
  }

  get label(): string {
    const s = (this.status || '').toLowerCase().replace(/[-_ ]/g, '');
    if (s === 'compliant' || s === 'متوافق') return 'متوافق';
    if (s === 'noncompliant' || s === 'غير متوافق') return 'غير متوافق';
    if (s === 'blocked') return 'محظور';
    if (s === 'pending') return 'قيد المراجعة';
    // Scholars compliant — show the full Arabic label
    if (this.status === SCHOLARS_COMPLIANT_VERDICT) return SCHOLARS_COMPLIANT_VERDICT;
    return this.status || 'غير محدد';
  }
}
