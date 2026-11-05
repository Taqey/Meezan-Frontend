import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MzPaginationButtonComponent } from '../mz-pagination-button/mz-pagination-button.component';

/* ───────────── Pagination ───────────── */
@Component({
  selector: 'mz-pagination',
  standalone: true,
  imports: [CommonModule, MzPaginationButtonComponent],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-pagination.component.html',
  styleUrl: './mz-pagination.component.css',
})
export class MzPaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();
  get pages(): number[] {
    const max = 5;
    let start = Math.max(1, this.page - Math.floor(max / 2));
    const end = Math.min(this.totalPages, start + max - 1);
    start = Math.max(1, end - max + 1);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }
}
