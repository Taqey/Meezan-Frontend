import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MzDetailsSectionComponent } from '../mz-details-section/mz-details-section.component';
import { type MzSrPoint } from '../models/mz-sr-point.model';

@Component({
  selector: 'mz-support-resistance-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MzDetailsSectionComponent],
  host: { class: 'mz', style: 'display:block;height:100%' },
  templateUrl: './mz-support-resistance-card.component.html',
})
export class MzSupportResistanceCardComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() pivotLabel?: string | null;
  @Input() note?: string | null;
  @Input() points: MzSrPoint[] = [];
  @Input() markerPos: number | null = null;
  @Input() markerLabel = '';
  @Input() emptyText = '';
}
