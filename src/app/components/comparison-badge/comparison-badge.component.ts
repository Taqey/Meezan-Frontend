import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, TrendingDown, Minus } from 'lucide-angular';

@Component({
  selector: 'app-comparison-badge',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <span class="comparison-badge" [ngClass]="badgeClass">
      <lucide-icon *ngIf="isCheap" [img]="TrendingUpIcon" size="13"></lucide-icon>
      <lucide-icon *ngIf="isExpensive" [img]="TrendingDownIcon" size="13"></lucide-icon>
      <lucide-icon *ngIf="isUnavailable" [img]="MinusIcon" size="13"></lucide-icon>
      <span *ngIf="isFair" class="neutral-line"></span>
      {{ label }}
    </span>
  `
})
export class ComparisonBadgeComponent {
  /**
   * 'Cheap' | 'Expensive' | 'Fair' | 'Unavailable'. null / empty / unknown values are
   * treated as 'Unavailable' — never silently promoted to "قريبة من العادلة".
   */
  @Input() comparison?: string | null;

  readonly TrendingUpIcon = TrendingUp;
  readonly TrendingDownIcon = TrendingDown;
  readonly MinusIcon = Minus;

  private get normalized(): string {
    return (this.comparison || '').trim().toLowerCase();
  }

  get isCheap(): boolean {
    const c = this.normalized;
    return c === 'cheap' || c === 'أقل من القيمة العادلة' || c === 'أرخص من قيمتها العادلة';
  }

  get isExpensive(): boolean {
    const c = this.normalized;
    return c === 'expensive' || c === 'أعلى من القيمة العادلة' || c === 'أغلى من قيمتها العادلة';
  }

  get isUnavailable(): boolean {
    if (this.isCheap || this.isExpensive) return false;
    const c = this.normalized;
    // Only an explicit "fair" verdict (enum name or legacy Arabic label) counts as fair.
    if (c === 'fair' || c.includes('قريبة')) return false;
    // null / empty / 'unavailable' / anything unknown → cannot compute a verdict.
    return true;
  }

  get isFair(): boolean {
    return !this.isCheap && !this.isExpensive && !this.isUnavailable;
  }

  get badgeClass(): string {
    if (this.isCheap) return 'cheap';
    if (this.isExpensive) return 'expensive';
    if (this.isUnavailable) return 'unavailable';
    return 'fair';
  }

  get label(): string {
    if (this.isCheap) return 'أرخص من العادلة';
    if (this.isExpensive) return 'أغلى من العادلة';
    if (this.isUnavailable) return 'بيانات غير كافية';
    return 'قريبة من العادلة';
  }
}
