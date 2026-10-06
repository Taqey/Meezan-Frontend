import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';

/**
 * Scroll reveal: fades/slides the host into view the first time it enters
 * the viewport (styling lives in styles.css: .reveal → .revealed).
 * Animates once only; honors prefers-reduced-motion (shows instantly).
 * Pure transform/opacity — no layout cost.
 */
@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealDirective implements OnInit, OnDestroy {
  /** Extra stagger delay in ms (kept small so content never waits long). */
  @Input() appRevealDelay = 0;

  private observer: IntersectionObserver | null = null;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const el = this.host.nativeElement;
    if (this.prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      el.classList.add('revealed');
      return;
    }
    if (this.appRevealDelay > 0) {
      el.style.setProperty('--reveal-delay', `${Math.min(this.appRevealDelay, 400)}ms`);
    }
    el.classList.add('reveal');
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add('revealed');
          this.observer?.disconnect();
          this.observer = null;
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
