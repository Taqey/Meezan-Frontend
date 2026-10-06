import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LayoutGrid, Table, Flame } from 'lucide-angular';

export type EntityView = 'grid' | 'table' | 'heatmap';

/** Grid / Table / Heatmap switcher shared by the Sectors and Indices pages. */
@Component({
  selector: 'app-view-switcher',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="view-switch" role="group" aria-label="طريقة العرض">
      <button type="button" [class.active]="view === 'grid'" [attr.aria-pressed]="view === 'grid'" (click)="pick('grid')">
        <lucide-icon [img]="GridIcon" size="15"></lucide-icon> شبكة
      </button>
      <button type="button" [class.active]="view === 'table'" [attr.aria-pressed]="view === 'table'" (click)="pick('table')">
        <lucide-icon [img]="TableIcon" size="15"></lucide-icon> جدول
      </button>
      <button type="button" [class.active]="view === 'heatmap'" [attr.aria-pressed]="view === 'heatmap'" (click)="pick('heatmap')">
        <lucide-icon [img]="HeatIcon" size="15"></lucide-icon> خريطة حرارية
      </button>
    </div>
  `
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
