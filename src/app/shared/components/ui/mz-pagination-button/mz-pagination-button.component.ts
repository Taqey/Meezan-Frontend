import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mz-pagination-button',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'mz', style: 'display:inline-flex' },
  templateUrl: './mz-pagination-button.component.html',
  styleUrl: './mz-pagination-button.component.css',
})
export class MzPaginationButtonComponent {
  @Input() active = false;
  @Input() disabled = false;
  @Output() pressed = new EventEmitter<void>();
}
