import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevealDirective } from '../../../directives/reveal.directive';

/* ───────────── DetailsSection (generic white section card) ───────────── */
@Component({
  selector: 'mz-details-section',
  standalone: true,
  imports: [CommonModule, RevealDirective],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-details-section.component.html',
})
export class MzDetailsSectionComponent {
  @Input() eyebrow = '';
  @Input() title = '';
}
