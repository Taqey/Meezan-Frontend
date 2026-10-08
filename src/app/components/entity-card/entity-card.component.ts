import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ChevronLeft, type LucideIconData } from 'lucide-angular';

export interface EntityStat {
  label: string;
  /** Null renders as "—". */
  value: string | null;
  tone?: 'positive' | 'negative' | 'muted' | null;
}

/**
 * Shared index/sector card: accent top border, tinted icon, count pill,
 * bilingual names, two mini-stats and a footer link. Colors come from CSS
 * variables so each entity keeps its own accent with one style block.
 */
@Component({
  selector: 'app-entity-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <a class="entity-card"
       [routerLink]="link"
       [class.featured]="featured"
       [style.--accent]="accent"
       [style.--tint]="tint"
       [style.--ink]="ink"
       [style.--item-index]="itemIndex">
      <div class="entity-card-top">
        <span class="entity-icon-box">
          <lucide-icon [img]="icon" size="20"></lucide-icon>
        </span>
        <div class="entity-card-top-badges">
          <span *ngIf="ribbon" class="entity-ribbon">{{ ribbon }}</span>
          <span class="entity-pill">{{ pill }}</span>
        </div>
      </div>

      <h2>{{ title }}</h2>
      <p class="entity-en">{{ subtitle }}</p>

      <div class="entity-stats" *ngIf="stats.length">
        <div class="entity-stat" *ngFor="let st of stats">
          <span>{{ st.label }}</span>
          <strong [ngClass]="st.value == null ? 'muted' : st.tone">{{ st.value ?? '—' }}</strong>
        </div>
      </div>

      <div class="entity-foot">
        <span>{{ footerText }}</span>
        <lucide-icon [img]="ChevronLeftIcon" size="15"></lucide-icon>
      </div>
    </a>
  `
})
export class EntityCardComponent {
  readonly ChevronLeftIcon = ChevronLeft;

  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon?: LucideIconData;
  @Input() accent = '';
  @Input() tint = '';
  @Input() ink = '';
  @Input() pill = '';
  @Input() stats: EntityStat[] = [];
  @Input() footerText = '';
  @Input() link: string | unknown[] | null = null;
  @Input() ribbon?: string | null;
  @Input() featured = false;
  @Input() itemIndex = 0;
}
