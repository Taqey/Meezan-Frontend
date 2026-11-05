import { Component, Input } from '@angular/core';
import { FavoriteToggleComponent } from '../../favorite-toggle/favorite-toggle.component';

/** Star toggle bound to the shared favorites service. */
@Component({
  selector: 'mz-favorite-button',
  standalone: true,
  imports: [FavoriteToggleComponent],
  host: { class: 'mz mz-fav' },
  templateUrl: './mz-favorite-button.component.html',
  styleUrl: './mz-favorite-button.component.css',
})
export class MzFavoriteButtonComponent {
  @Input() symbol = '';
}
