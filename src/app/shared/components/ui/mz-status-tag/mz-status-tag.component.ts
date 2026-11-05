import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Compliant / non-compliant / neutral tag. */
@Component({
  selector: 'mz-status-tag',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:inline-flex' },
  templateUrl: './mz-status-tag.component.html',
})
export class MzStatusTagComponent {
  @Input() tone: 'good' | 'bad' | 'neutral' = 'neutral';
  @Input() label = '';
}
