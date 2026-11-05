import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type MzLegendItem } from '../models/mz-legend-item.model';

@Component({
  selector: 'mz-results-info',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-results-info.component.html',
  styleUrl: './mz-results-info.component.css',
})
export class MzResultsInfoComponent {
  @Input() text = '';
  @Input() note?: string | null;
  @Input() legend?: MzLegendItem[] | null;
}
