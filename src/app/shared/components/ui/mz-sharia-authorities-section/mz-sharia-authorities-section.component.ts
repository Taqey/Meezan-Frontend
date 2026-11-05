import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MzAuthorityCardComponent } from '../mz-authority-card/mz-authority-card.component';
import { MzMetricItemComponent } from '../mz-metric-item/mz-metric-item.component';
import { type MzAuthority } from '../models/mz-authority.model';
import { type MzMetric } from '../models/mz-metric.model';
import { MzDetailsSectionComponent } from '../mz-details-section/mz-details-section.component';
import { type MzShariaRatio } from '../models/mz-sharia-ratio.model';

@Component({
  selector: 'mz-sharia-authorities-section',
  standalone: true,
  imports: [CommonModule, MzDetailsSectionComponent, MzAuthorityCardComponent, MzMetricItemComponent],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-sharia-authorities-section.component.html',
  styleUrl: './mz-sharia-authorities-section.component.css',
})
export class MzShariaAuthoritiesSectionComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() summaryText = '';
  @Input() summaryNote?: string | null;
  @Input() summaryTone: 'good' | 'bad' | 'neutral' | '' = '';
  @Input() authorities: MzAuthority[] = [];
  @Input() ratiosTitle = '';
  @Input() ratiosMeta?: string | null;
  @Input() ratios: MzMetric[] = [];
  @Input() shariaRatios?: MzShariaRatio[] | null;
  @Output() authorityAction = new EventEmitter<MzAuthority>();
}
