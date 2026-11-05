import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/* ───────────── PageHeader ───────────── */
@Component({
  selector: 'mz-page-header',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-page-header.component.html',
  styleUrl: './mz-page-header.component.css',
})
export class MzPageHeaderComponent {
  @Input() badge = '';
  @Input() count = '';
  @Input() title = '';
  @Input() description = '';
}
