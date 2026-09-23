import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, TrendingDown } from 'lucide-angular';

@Component({
  selector: 'app-comparison-badge',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <span class="comparison-badge" [ngClass]="badgeClass">
      <lucide-icon *ngIf="isCheap" [img]="TrendingUpIcon" size="13"></lucide-icon>
      <lucide-icon *ngIf="isExpensive" [img]="TrendingDownIcon" size="13"></lucide-icon>
      <span *ngIf="isFair" class="neutral-line"></span>
      {{ label }}
    </span>
  `
})
export class ComparisonBadgeComponent {
  @Input() comparison?: string | null;

  readonly TrendingUpIcon = TrendingUp;
  readonly TrendingDownIcon = TrendingDown;

  get isCheap(): boolean {
    const c = (this.comparison || '').toLowerCase();
    return c === 'cheap' || c === 'أقل من القيمة العادلة' || c === 'أرخص من قيمتها العادلة';
  }

  get isExpensive(): boolean {
    const c = (this.comparison || '').toLowerCase();
    return c === 'expensive' || c === 'أعلى من القيمة العادلة' || c === 'أغلى من قيمتها العادلة';
  }

  get isFair(): boolean {
    return !this.isCheap && !this.isExpensive;
  }

  get badgeClass(): string {
    if (this.isCheap) return 'cheap';
    if (this.isExpensive) return 'expensive';
    return 'fair';
  }

  get label(): string {
    if (this.isCheap) return 'أرخص من العادلة';
    if (this.isExpensive) return 'أغلى من العادلة';
    return 'قريبة من العادلة';
  }
}
