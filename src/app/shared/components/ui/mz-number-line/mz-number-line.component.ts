import { Component, EventEmitter, Input, Output, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type MzNumberLineBand } from '../models/mz-number-line-band.model';

const PLAYED_NUMBER_LINES = new Set<string>();

@Component({
  selector: 'mz-number-line',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz mz-numline-host', style: 'display:block' },
  templateUrl: './mz-number-line.component.html',
})
export class MzNumberLineComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly Math = Math;

  @Input() instanceId = 'numline_default';
  @Input() bands: MzNumberLineBand[] = [];
  @Input() ticks: number[] = [0, 25, 50, 75, 100];
  @Input() direction: 'rtl' | 'ltr' = 'rtl';
  @Input() activeBandId: string | null = null;
  @Input() ariaLabel = 'مقياس توزيع الأصول المستهدف من 0% إلى 100%';

  @Output() bandHover = new EventEmitter<string | null>();

  hoveredBand: MzNumberLineBand | null = null;
  hasEntered = false;
  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  get lanesCount(): number {
    if (!this.bands.length) return 1;
    const maxLane = this.bands.reduce((max, b) => Math.max(max, b.lane ?? 0), 0);
    return Math.max(1, maxLane + 1);
  }

  ngOnInit(): void {
    if (PLAYED_NUMBER_LINES.has(this.instanceId)) {
      this.hasEntered = true;
    }
  }

  ngAfterViewInit(): void {
    if (this.hasEntered) return;

    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          this.hasEntered = true;
          PLAYED_NUMBER_LINES.add(this.instanceId);
          this.observer?.disconnect();
        }
      }, { threshold: 0.15 });
      this.observer.observe(this.el.nativeElement);
    } else {
      this.hasEntered = true;
      PLAYED_NUMBER_LINES.add(this.instanceId);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  onBandEnter(band: MzNumberLineBand): void {
    this.hoveredBand = band;
    this.bandHover.emit(band.id);
  }

  onBandLeave(): void {
    this.hoveredBand = null;
    this.bandHover.emit(null);
  }
}
