import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ChevronLeft } from 'lucide-angular';

/* ───────────── InfoCard ───────────── */
@Component({
  selector: 'mz-info-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-info-card.component.html',
})
export class MzInfoCardComponent {
  readonly LinkIcon = ChevronLeft;
  @Input() label = '';
  @Input() title = '';
  @Input() description?: string | null;
  @Input() footerLabel?: string | null;
  @Input() link?: string | unknown[] | null;
}
