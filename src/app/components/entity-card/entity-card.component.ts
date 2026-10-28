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
  styles: [`
    :host {
      display: block;
      min-width: 0;
      height: 100%;
    }
  `],
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
          <img *ngIf="logoUrl && !logoFailed"
               class="entity-logo"
               [src]="logoUrl"
               [alt]="title"
               loading="lazy"
               decoding="async"
               (error)="logoFailed = true">
          <lucide-icon *ngIf="!logoUrl || logoFailed" [img]="icon" size="20"></lucide-icon>
        </span>
        <div class="entity-card-top-badges">
          <span *ngIf="ribbon" class="entity-ribbon" [attr.title]="ribbonTitle ?? null">{{ ribbon }}</span>
          <span class="entity-pill" [attr.title]="pill">{{ pill || '—' }}</span>
        </div>
      </div>

      <h2 [attr.title]="title">{{ title || '—' }}</h2>
      <p class="entity-en" [attr.title]="subtitle">{{ subtitle || '—' }}</p>

      <div class="entity-stats" [class.compact-stats]="!autoPadStats" *ngIf="normalizedStats.length">
        <div class="entity-stat" *ngFor="let st of normalizedStats">
          <span>{{ st.label }}</span>
          <strong [ngClass]="st.value == null ? 'muted' : st.tone">{{ st.value ?? '—' }}</strong>
        </div>
      </div>

      <div class="entity-foot" *ngIf="footerText">
        <span [attr.title]="footerText">{{ footerText }}</span>
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
  /** Optional native tooltip for the ribbon (e.g. Sharia source clarification). */
  @Input() ribbonTitle?: string | null;
  @Input() featured = false;
  @Input() itemIndex = 0;
  /** Optional image (e.g. a fund logo). Falls back to the icon when absent or broken. */
  @Input() logoUrl?: string | null;
  @Input() autoPadStats = true;
  logoFailed = false;

  get normalizedStats(): EntityStat[] {
    const list = [...(this.stats || [])];
    if (!this.autoPadStats) {
      // Return only actual provided stats; do not generate empty dash-only placeholder rows
      return list;
    }
    // Keep exactly 6 stats slots (typical fund has up to 6: Price, Daily Change, 1Y Return, AUM, Fees, Risk)
    // For sectors / funds relying on standard 6 slots, pad up to 6 with null values
    while (list.length < 6) {
      list.push({ label: '—', value: '—' });
    }
    return list.slice(0, 6);
  }
}

