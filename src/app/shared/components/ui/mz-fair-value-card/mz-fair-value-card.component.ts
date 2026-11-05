import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MzDetailsSectionComponent } from '../mz-details-section/mz-details-section.component';
import { type MzFairMethod } from '../models/mz-fair-method.model';

@Component({
  selector: 'mz-fair-value-card',
  standalone: true,
  imports: [CommonModule, MzDetailsSectionComponent],
  host: { class: 'mz', style: 'display:block;height:100%' },
  templateUrl: './mz-fair-value-card.component.html',
  styleUrl: './mz-fair-value-card.component.css',
})
export class MzFairValueCardComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() unavailable = false;
  @Input() unavailableTitle = '';
  @Input() unavailableText = '';
  @Input() value = '';
  @Input() currency = '';
  @Input() gapText?: string | null;
  @Input() gapTone?: 'positive' | 'negative' | 'muted' | null;
  @Input() formulaNote?: string | null;
  @Input() methods: MzFairMethod[] = [];
}
