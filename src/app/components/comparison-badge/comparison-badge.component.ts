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

  /** Percentage difference from current price to fair value. Used to append "%" to the badge label. */
  @Input() fairValueDiffPct?: number | null;

  /** Current price — used with fairValue to compute upside for the cheap case. */
  @Input() closingPrice?: number | null;

  /** Fair value — used with closingPrice to compute upside for the cheap case. */
  @Input() fairValue?: number | null;

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
    const pct = this.fairValueDiffPct;
    const hasPct = pct !== null && pct !== undefined && !isNaN(pct);
    const pctStr = hasPct ? ` بـ ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : '';

    if (this.isCheap) {
      const up = this.upsidePct;
      const mult = this.upsideMultiple;
      if (up !== null && mult !== null) {
        return `أرخص من العادلة — فرصة صعود +${up.toFixed(1)}% (${mult.toFixed(1)}x للوصول للعادلة)`;
      }
      return `أرخص من العادلة${pctStr}`;
    }
    if (this.isExpensive) {
      const down = this.upsidePct;
      const over = this.overMultiple;
      if (down !== null && over !== null) {
        return `أغلى من العادلة — فرصة هبوط ${down.toFixed(1)}% (${over.toFixed(1)}x فوق العادلة)`;
      }
      return `أغلى من العادلة${pctStr}`;
    }
    if (this.isUnavailable) return 'بيانات غير كافية';
    return `قريبة من العادلة${pctStr}`;
  }

  /** Upside when price is below fair value: (fair / price - 1) * 100. */
  private get upsidePct(): number | null {
    const p = this.closingPrice !== null && this.closingPrice !== undefined ? Number(this.closingPrice) : NaN;
    const f = this.fairValue !== null && this.fairValue !== undefined ? Number(this.fairValue) : NaN;
    if (!isNaN(p) && !isNaN(f) && p > 0 && f > 0) {
      return (f / p - 1) * 100;
    }
    // Fallback: derive from the old-convention diffPct ((price - fair) / fair * 100).
    const pct = this.fairValueDiffPct;
    if (pct !== null && pct !== undefined && !isNaN(pct) && (1 + pct / 100) > 0) {
      return (1 / (1 + pct / 100) - 1) * 100;
    }
    return null;
  }

  /** Fair-to-price multiple for the cheap case: fair / price. */
  private get upsideMultiple(): number | null {
    const p = this.closingPrice !== null && this.closingPrice !== undefined ? Number(this.closingPrice) : NaN;
    const f = this.fairValue !== null && this.fairValue !== undefined ? Number(this.fairValue) : NaN;
    if (!isNaN(p) && !isNaN(f) && p > 0 && f > 0) {
      return f / p;
    }
    // Fallback: derive from the old-convention diffPct.
    const pct = this.fairValueDiffPct;
    if (pct !== null && pct !== undefined && !isNaN(pct) && (1 + pct / 100) > 0) {
      return 1 / (1 + pct / 100);
    }
    return null;
  }

  /** Price-to-fair multiple for the expensive case: price / fair. */
  private get overMultiple(): number | null {
    const p = this.closingPrice !== null && this.closingPrice !== undefined ? Number(this.closingPrice) : NaN;
    const f = this.fairValue !== null && this.fairValue !== undefined ? Number(this.fairValue) : NaN;
    if (!isNaN(p) && !isNaN(f) && p > 0 && f > 0) {
      return p / f;
    }
    // Fallback: derive from the old-convention diffPct ((price - fair) / fair * 100).
    const pct = this.fairValueDiffPct;
    if (pct !== null && pct !== undefined && !isNaN(pct)) {
      return 1 + pct / 100;
    }
    return null;
  }
}
