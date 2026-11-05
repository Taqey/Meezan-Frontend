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
  templateUrl: './filter-chips.component.html',
})
export class FilterChipsComponent {
  @Input() chips: ChipOption[] = [];
  @Input() activeId = '';
  @Output() selected = new EventEmitter<string>();

  pick(id: string): void {
    if (id !== this.activeId) this.selected.emit(id);
  }
}
