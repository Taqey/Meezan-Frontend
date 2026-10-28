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
  template: `
    <div class="table-scroll">
      <table class="entity-table" [attr.aria-label]="ariaLabel">
        <thead>
          <tr>
            <th *ngFor="let c of columns" scope="col" [attr.aria-sort]="c.sortable ? ariaSortFor(c.key) : null">
              <button *ngIf="c.sortable" type="button" (click)="sortChange.emit(c.key)">{{ c.label }}</button>
              <ng-container *ngIf="!c.sortable">{{ c.label }}</ng-container>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of rows; trackBy: trackRow">
            <td *ngFor="let c of columns">
              <a *ngIf="cell(r, c.key).link; else plainCell" [routerLink]="cell(r, c.key).link" class="text-link">
                {{ cell(r, c.key).text }}
              </a>
              <ng-template #plainCell>
                <bdi *ngIf="cell(r, c.key).ltr" dir="ltr" [ngClass]="cell(r, c.key).tone">{{ cell(r, c.key).text }}</bdi>
                <span *ngIf="!cell(r, c.key).ltr" [ngClass]="cell(r, c.key).tone">{{ cell(r, c.key).text }}</span>
              </ng-template>
              <span *ngIf="cell(r, c.key).sub" class="entity-cell-sub">{{ cell(r, c.key).sub }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
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
