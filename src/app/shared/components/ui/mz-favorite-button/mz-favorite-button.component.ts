import { Component, Input } from '@angular/core';
import { FavoriteToggleComponent } from '../../favorite-toggle/favorite-toggle.component';

/** Star toggle bound to the shared favorites service. */
@Component({
  selector: 'mz-favorite-button',
  standalone: true,
  imports: [FavoriteToggleComponent],
  host: { class: 'mz mz-fav' },
  templateUrl: './mz-favorite-button.component.html',
})
export class MzFavoriteButtonComponent {
  @Input() symbol = '';
}
