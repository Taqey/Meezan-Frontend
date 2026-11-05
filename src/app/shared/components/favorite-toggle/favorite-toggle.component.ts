import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Star } from 'lucide-angular';
import { FavoritesService } from '../../../core/services/favorites.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Star toggle for one stock symbol. Reads the shared FavoritesService signal,
 * so every instance (Stocks list, detail header, Favorites page) stays in sync.
 * Safe to place over a card link: the click never navigates.
 */
@Component({
  selector: 'app-favorite-toggle',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './favorite-toggle.component.html',
})
export class FavoriteToggleComponent {
  @Input() symbol = '';

  readonly StarIcon = Star;

  constructor(
    private readonly favorites: FavoritesService,
    private readonly toast: ToastService
  ) {}

  get isFav(): boolean {
    return this.favorites.isFavorite(this.symbol);
  }

  onToggle(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const action = this.favorites.toggle(this.symbol);
    this.toast.show(action === 'added' ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة');
  }
}
