import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LayoutGrid, Table, Flame } from 'lucide-angular';

export type EntityView = 'grid' | 'table' | 'heatmap';

/** Grid / Table / Heatmap switcher shared by the Sectors and Indices pages. */
@Component({
  selector: 'app-view-switcher',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './view-switcher.component.html',
})
export class ViewSwitcherComponent {
  readonly GridIcon = LayoutGrid;
  readonly TableIcon = Table;
  readonly HeatIcon = Flame;

  @Input() view: EntityView = 'grid';
  @Output() viewChange = new EventEmitter<EntityView>();

  pick(view: EntityView): void {
    if (view !== this.view) this.viewChange.emit(view);
  }
}
