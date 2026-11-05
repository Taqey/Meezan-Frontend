import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mz-chip',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:inline-flex' },
  templateUrl: './mz-chip.component.html',
})
export class MzChipComponent {
  @Input() active = false;
  @Output() selected = new EventEmitter<void>();
}
