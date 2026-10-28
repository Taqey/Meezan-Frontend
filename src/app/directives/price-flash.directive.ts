import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

/**
 * Flashes the host green/red briefly when its numeric value updates
 * (up/down). Never flashes on first render. Styling lives in styles.css
 * (.flash-up / .flash-down keyframes). Timer-based; safe with OnPush-less
 * change detection since it only toggles classes.
 */
@Directive({
  selector: '[appPriceFlash]',
  standalone: true
})
export class PriceFlashDirective implements OnChanges, OnDestroy {
  @Input() appPriceFlash: number | null | undefined;

  private seenFirst = false;
  private previous: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['appPriceFlash']) return;
    const next = this.toNumber(this.appPriceFlash);
    if (!this.seenFirst) {
      this.seenFirst = true;
      this.previous = next;
      return;
    }
    const prev = this.previous;
    this.previous = next;
    if (next === null || prev === null || next === prev) return;
    this.flash(next > prev ? 'flash-up' : 'flash-down');
  }

  ngOnDestroy(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private flash(kind: 'flash-up' | 'flash-down'): void {
    const el = this.host.nativeElement;
    el.classList.remove('flash-up', 'flash-down');
    // Force reflow so a repeated same-direction move replays the keyframes.
    void el.offsetWidth;
    el.classList.add(kind);
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      el.classList.remove('flash-up', 'flash-down');
      this.timer = null;
    }, 700);
  }

  private toNumber(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return isFinite(n) ? n : null;
  }
}
