import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface HeaderCrumb {
  label: string;
  link?: string | unknown[];
}

/**
 * Shared page header: breadcrumb, title, description and a projected toolbar.
 * Used by the Sectors and Indices pages so both share one layout system.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
})
export class PageHeaderComponent {
  @Input() crumbs: HeaderCrumb[] = [];
  @Input() pill = '';
  @Input() title = '';
  @Input() description = '';
}
