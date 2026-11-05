import { Component, Input } from '@angular/core';
import { MzDetailsSectionComponent } from '../mz-details-section/mz-details-section.component';
import { type MzIndicator } from '../models/mz-indicator.model';
import { MzInfoGridComponent } from '../mz-info-grid/mz-info-grid.component';

@Component({
  selector: 'mz-market-indicators-section',
  standalone: true,
  imports: [MzDetailsSectionComponent, MzInfoGridComponent],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-market-indicators-section.component.html',
  styleUrl: './mz-market-indicators-section.component.css',
})
export class MzMarketIndicatorsSectionComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() items: MzIndicator[] = [];
}
