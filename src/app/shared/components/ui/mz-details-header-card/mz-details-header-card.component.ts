import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ExternalLink } from 'lucide-angular';
import { MzBadgeComponent } from '../mz-badge/mz-badge.component';
import { MzFavoriteButtonComponent } from '../mz-favorite-button/mz-favorite-button.component';
import { type MzHeaderTag } from '../models/mz-header-tag.model';

@Component({
  selector: 'mz-details-header-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MzBadgeComponent, MzFavoriteButtonComponent],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-details-header-card.component.html',
})
export class MzDetailsHeaderCardComponent {
  readonly ExternalLinkIcon = ExternalLink;
  @Input() logoUrl?: string | null;
  @Input() title = '';
  @Input() code?: string | null;
  @Input() secondaryName?: string | null;
  @Input() favoriteSymbol?: string | null;
  @Input() tags: MzHeaderTag[] = [];
  @Input() priceLabel = '';
  @Input() price?: string | null;
  @Input() currency = '';
  @Input() changeText?: string | null;
  @Input() changeTone?: 'positive' | 'negative' | 'muted' | null;
  logoFailed = false;
}
