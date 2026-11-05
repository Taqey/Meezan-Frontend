import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface EntityTableColumn {
  key: string;
  label: string;
  sortable: boolean;
}

export interface EntityTableCell {
  text: string;
  sub?: string | null;
  tone?: 'positive' | 'negative' | 'muted' | null;
  link?: string | unknown[] | null;
  /** Renders the text inside <bdi dir="ltr"> (numbers, codes). */
  ltr?: boolean;
}

export interface EntityTableRow {
  id: string | number;
  cells: Record<string, EntityTableCell>;
}

/** Sortable entity table; pages own the data and the sort state. */
@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './entity-table.component.html',
})
export class EntityTableComponent {
  @Input() columns: EntityTableColumn[] = [];
  @Input() rows: EntityTableRow[] = [];
  @Input() sortKey = '';
  @Input() sortDir: 'asc' | 'desc' = 'desc';
  @Input() ariaLabel = '';
  @Output() sortChange = new EventEmitter<string>();

  cell(row: EntityTableRow, key: string): EntityTableCell {
    return row.cells[key] ?? { text: '—', tone: 'muted' };
  }

  trackRow(_index: number, row: EntityTableRow): string | number {
    return row.id;
  }

  ariaSortFor(key: string): string {
    if (this.sortKey !== key) return 'none';
    return this.sortDir === 'desc' ? 'descending' : 'ascending';
  }
}
