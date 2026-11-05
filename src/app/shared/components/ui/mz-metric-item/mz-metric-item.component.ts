import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type Tone } from '../models/tone.model';

@Component({
  selector: 'mz-metric-item',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:block;min-width:0' },
  templateUrl: './mz-metric-item.component.html',
})
export class MzMetricItemComponent {
  @Input() label = '';
  @Input() value: string | number | null | undefined;
  @Input() tone: Tone;
  @Input() ltr = false;
}
