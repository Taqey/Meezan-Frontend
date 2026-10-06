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
  template: `
    <nav class="crumbs" aria-label="مسار التنقل">
      <ng-container *ngFor="let c of crumbs; let last = last">
        <a *ngIf="c.link && !last" [routerLink]="c.link">{{ c.label }}</a>
        <span *ngIf="!c.link && !last">{{ c.label }}</span>
        <span *ngIf="!last" aria-hidden="true">/</span>
      </ng-container>
      <span *ngIf="pill" class="crumb-pill">{{ pill }}</span>
    </nav>

    <div class="page-hero">
      <div>
        <h1>{{ title }}</h1>
        <p *ngIf="description">{{ description }}</p>
      </div>
      <div class="page-toolbar">
        <ng-content select="[toolbar]"></ng-content>
      </div>
    </div>
  `
})
export class PageHeaderComponent {
  @Input() crumbs: HeaderCrumb[] = [];
  @Input() pill = '';
  @Input() title = '';
  @Input() description = '';
}
