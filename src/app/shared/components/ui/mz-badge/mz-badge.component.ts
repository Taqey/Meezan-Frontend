import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mz-badge',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:inline-flex' },
  templateUrl: './mz-badge.component.html',
  styleUrl: './mz-badge.component.css',
})
export class MzBadgeComponent {
  @Input() titleText = '';
  @Input() tone: 'default' | 'neutral' | 'danger' | 'warn' | 'outline' = 'default';
  @Input() pill = false;
}
