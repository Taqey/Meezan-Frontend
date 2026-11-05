import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ChevronLeft } from 'lucide-angular';
import { MzBadgeComponent } from '../mz-badge/mz-badge.component';
import { MzFavoriteButtonComponent } from '../mz-favorite-button/mz-favorite-button.component';
import { MzMetricItemComponent } from '../mz-metric-item/mz-metric-item.component';
import { MzStatusTagComponent } from '../mz-status-tag/mz-status-tag.component';
import { type MzListingCardData } from '../models/mz-listing-card-data.model';

@Component({
  selector: 'mz-listing-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MzBadgeComponent, MzFavoriteButtonComponent, MzMetricItemComponent, MzStatusTagComponent],
  host: { class: 'mz', style: 'display:block;min-width:0' },
  templateUrl: './mz-listing-card.component.html',
})
export class MzListingCardComponent {
  readonly LinkIcon = ChevronLeft;
  @Input() card!: MzListingCardData;
  logoFailed = false;

  isStr(val: unknown): val is string {
    return typeof val === 'string';
  }
}
