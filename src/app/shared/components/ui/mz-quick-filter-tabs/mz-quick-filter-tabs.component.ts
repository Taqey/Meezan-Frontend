import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MzChipComponent } from '../mz-chip/mz-chip.component';
import { type MzTab } from '../models/mz-tab.model';

@Component({
  selector: 'mz-quick-filter-tabs',
  standalone: true,
  imports: [CommonModule, MzChipComponent],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-quick-filter-tabs.component.html',
})
export class MzQuickFilterTabsComponent {
  @Input() tabs: MzTab[] = [];
  @Input() active = '';
  @Output() onChange = new EventEmitter<string>();
}
