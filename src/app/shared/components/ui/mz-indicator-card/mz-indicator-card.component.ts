import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ExternalLink } from 'lucide-angular';

@Component({
  selector: 'mz-indicator-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-indicator-card.component.html',
  styleUrl: './mz-indicator-card.component.css',
})
export class MzIndicatorCardComponent {
  readonly ExternalLinkIcon = ExternalLink;
  @Input() label = '';
  @Input() value: string | number | null | undefined;
  @Input() hint?: string | null;
  @Input() ltr = false;
  @Input() link?: string | unknown[] | null;
  @Input() ariaLabel?: string | null;
  @Input() externalUrl?: string | null;
}
