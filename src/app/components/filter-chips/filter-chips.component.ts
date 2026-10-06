import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChipOption {
  id: string;
  label: string;
}

/** Horizontally scrollable quick-filter chips with a single active state. */
@Component({
  selector: 'app-filter-chips',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chip-row no-print" role="group" aria-label="فرز سريع">
      <button
        *ngFor="let c of chips"
        type="button"
        class="chip"
        [class.active]="c.id === activeId"
        [attr.aria-pressed]="c.id === activeId"
        (click)="pick(c.id)">
        {{ c.label }}
      </button>
    </div>
  `
})
export class FilterChipsComponent {
  @Input() chips: ChipOption[] = [];
  @Input() activeId = '';
  @Output() selected = new EventEmitter<string>();

  pick(id: string): void {
    if (id !== this.activeId) this.selected.emit(id);
  }
}
