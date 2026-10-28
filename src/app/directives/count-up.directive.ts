import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

/**
 * Count-up numbers on first view (e.g. home stats). Animates with
 * requestAnimationFrame using the shared ease-out curve; sets the final
 * value instantly for prefers-reduced-motion. Re-animates if the target
 * changes after being shown (e.g. live data arriving late).
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true
})
export class CountUpDirective implements OnInit, OnChanges, OnDestroy {
  @Input('appCountUp') target: number | null | undefined;
  @Input() decimals = 0;
  @Input() duration = 900;

  private observer: IntersectionObserver | null = null;
  private rafId = 0;
  private shown = false;
  private current = 0;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (this.prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      this.renderTarget();
      this.shown = true;
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.run();
          this.observer?.disconnect();
          this.observer = null;
        }
      },
      { threshold: 0.2 }
    );
    this.observer.observe(this.host.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['target'] && this.shown) {
      this.run();
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    cancelAnimationFrame(this.rafId);
  }

  private run(): void {
    const to = this.toNumber(this.target);
    if (to === null) return;
    this.shown = true;
    const from = this.current;
    if (from === to) {
      this.render(to);
      return;
    }
    const start = performance.now();
    const dur = Math.max(1, this.duration);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      // easeOutExpo-ish: fast start, soft landing (matches --ease-out feel).
      const eased = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
      this.current = from + (to - from) * eased;
      this.render(this.current);
      if (t < 1) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.current = to;
      }
    };
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(tick);
  }

  private renderTarget(): void {
    const to = this.toNumber(this.target);
    if (to !== null) {
      this.current = to;
      this.render(to);
    }
  }

  private render(value: number): void {
    this.host.nativeElement.textContent = value.toFixed(this.decimals);
  }

  private toNumber(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return isFinite(n) ? n : null;
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
