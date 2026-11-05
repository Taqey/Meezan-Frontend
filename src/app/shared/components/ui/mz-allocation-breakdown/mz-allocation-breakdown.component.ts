import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type MzAllocation } from '../models/mz-allocation.model';
import { type MzNumberLineBand } from '../models/mz-number-line-band.model';
import { type MzAllocationCardItem } from '../models/mz-allocation-card-item.model';
import { MzNumberLineComponent } from '../mz-number-line/mz-number-line.component';
import { SHOW_NUMBER_LINE } from '../constants/show_number_line.constants';
import { SHOW_FUND_ALLOCATION_BAR } from '../constants/show_fund_allocation_bar.constants';

@Component({
  selector: 'mz-allocation-breakdown',
  standalone: true,
  imports: [CommonModule, MzNumberLineComponent],
  host: { class: 'mz', style: 'display:block' },
  templateUrl: './mz-allocation-breakdown.component.html',
  styleUrl: './mz-allocation-breakdown.component.css',
})
export class MzAllocationBreakdownComponent {
  readonly showNumberLine = SHOW_NUMBER_LINE;
  readonly showAllocationBar = SHOW_FUND_ALLOCATION_BAR;
  @Input() instanceId = 'alloc_default';
  @Input() badgeText = 'معايير الالتزام والسياسة الاستثمارية';
  @Input() bands: MzNumberLineBand[] = [];
  @Input() cards: MzAllocationCardItem[] = [];
  @Input() items: MzAllocation[] = [];
  @Input() ariaLabel = 'هيكل توزيع الأصول المستهدف';

  activeId: string | null = null;

  get displayItems(): MzAllocation[] {
    if (this.items && this.items.length > 0) return this.items;
    if (this.bands && this.bands.length > 0) {
      return this.bands.map(b => ({
        label: b.label,
        pct: b.min > 0 ? b.min : b.max,
        color: b.color
      }));
    }
    return [];
  }

  onNumberLineHover(id: string | null): void {
    this.activeId = id;
  }

  onCardHover(id: string): void {
    this.activeId = id;
  }

  onCardLeave(): void {
    this.activeId = null;
  }
}
