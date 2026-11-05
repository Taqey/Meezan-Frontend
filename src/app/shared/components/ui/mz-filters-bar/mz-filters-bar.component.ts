import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, SlidersHorizontal } from 'lucide-angular';
import { MzFilterDropdownComponent } from '../mz-filter-dropdown/mz-filter-dropdown.component';
import { MzSearchInputComponent } from '../mz-search-input/mz-search-input.component';
import { MzSelectComponent } from '../mz-select/mz-select.component';
import { type MzFiltersConfig } from '../models/mz-filters-config.model';

@Component({
  selector: 'mz-filters-bar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MzSearchInputComponent, MzSelectComponent, MzFilterDropdownComponent],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-filters-bar.component.html',
})
export class MzFiltersBarComponent {
  readonly TuneIcon = SlidersHorizontal;
  @Input() config!: MzFiltersConfig;
  @Output() searchChange = new EventEmitter<string>();
  @Output() controlChange = new EventEmitter<{ id: string; values: string[] }>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() advancedClick = new EventEmitter<void>();
}
