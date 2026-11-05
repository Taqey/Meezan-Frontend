import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MzIndicatorCardComponent } from '../mz-indicator-card/mz-indicator-card.component';
import { type MzIndicator } from '../models/mz-indicator.model';

@Component({
  selector: 'mz-info-grid',
  standalone: true,
  imports: [CommonModule, MzIndicatorCardComponent],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-info-grid.component.html',
  styleUrl: './mz-info-grid.component.css',
})
export class MzInfoGridComponent {
  @Input() items: MzIndicator[] = [];
}
