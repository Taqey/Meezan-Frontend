import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type MzListingCardData } from '../models/mz-listing-card-data.model';
import { MzListingCardComponent } from '../mz-listing-card/mz-listing-card.component';

/* ───────────── CardsGrid ───────────── */
@Component({
  selector: 'mz-cards-grid',
  standalone: true,
  imports: [CommonModule, MzListingCardComponent],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-cards-grid.component.html',
  styleUrl: './mz-cards-grid.component.css',
})
export class MzCardsGridComponent {
  @Input() cards: MzListingCardData[] = [];
  isFirstLoad = true;
  trackCard = (_: number, c: MzListingCardData) => c.id;

  constructor() {
    // Stagger animation plays on first mount only; not replayed on filter/page changes
    setTimeout(() => {
      this.isFirstLoad = false;
    }, 600);
  }
}
