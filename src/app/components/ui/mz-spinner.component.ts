import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared loading spinner (Task 2).
 * - Sizes: 'small' (16px), 'medium' (28px), 'large' (40px).
 * - Brand green ring with smooth rotation.
 * - Timing state machine when `[active]` is used:
 *   1. Waits ~150ms before showing so fast loads never flash it.
 *   2. Fades in over ~150ms.
 *   3. Stays visible for at least ~300ms once shown.
 *   4. Fades out over ~200ms before unmounting.
 * - When `[immediate]="true"` (e.g. inside action buttons), shows immediately on click.
 */
@Component({
  selector: 'mz-spinner',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'mz-spinner-host',
    '[class.is-overlay]': 'overlay',
    '[class.is-visible]': 'rendered && visible',
    '[class.is-Inline]': '!overlay'
  },
  template: `
    <span *ngIf="rendered"
          class="mz-spinner-wrap"
          [class.visible]="visible"
          [ngClass]="'size-' + size"
          role="status"
          [attr.aria-label]="label || 'جارٍ التحميل'">
      <span class="mz-spinner-ring" aria-hidden="true"></span>
      <span *ngIf="showLabel && label" class="mz-spinner-label">{{ label }}</span>
    </span>
  `
})
export class MzSpinnerComponent implements OnChanges, OnDestroy {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() active = true;
  @Input() immediate = false;
  @Input() overlay = false;
  @Input() label = 'جارٍ التحميل...';
  @Input() showLabel = false;

  rendered = false;
  visible = false;

  private shownAt = 0;
  private delayTimer: any = null;
  private minStayTimer: any = null;
  private fadeOutTimer: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['active'] || changes['immediate']) {
      this.syncState();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.delayTimer) { clearTimeout(this.delayTimer); this.delayTimer = null; }
    if (this.minStayTimer) { clearTimeout(this.minStayTimer); this.minStayTimer = null; }
    if (this.fadeOutTimer) { clearTimeout(this.fadeOutTimer); this.fadeOutTimer = null; }
  }

  private syncState(): void {
    this.clearTimers();

    if (this.active) {
      if (this.rendered && this.visible) {
        return;
      }
      if (this.immediate) {
        this.rendered = true;
        this.shownAt = Date.now();
        requestAnimationFrame(() => {
          this.visible = true;
        });
      } else {
        this.delayTimer = setTimeout(() => {
          this.delayTimer = null;
          this.rendered = true;
          this.shownAt = Date.now();
          requestAnimationFrame(() => {
            this.visible = true;
          });
        }, 150);
      }
    } else {
      if (!this.rendered) {
        this.visible = false;
        return;
      }
      const elapsed = this.shownAt ? Date.now() - this.shownAt : 300;
      const remaining = Math.max(0, 300 - elapsed);
      this.minStayTimer = setTimeout(() => {
        this.minStayTimer = null;
        this.visible = false;
        this.fadeOutTimer = setTimeout(() => {
          this.fadeOutTimer = null;
          this.rendered = false;
          this.shownAt = 0;
        }, 200);
      }, remaining);
    }
  }
}

