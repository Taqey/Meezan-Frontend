import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ShieldCheck } from 'lucide-angular';
import { ComparisonBadgeComponent } from '../comparison-badge/comparison-badge.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { FavoriteToggleComponent } from '../favorite-toggle/favorite-toggle.component';
import { PriceFlashDirective } from '../../directives/price-flash.directive';
import { INDEX_ARABIC_NAMES } from '../../models/api.models';

@Component({
  selector: 'app-stock-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ComparisonBadgeComponent, StatusBadgeComponent, FavoriteToggleComponent, PriceFlashDirective],
  template: `
    <a [routerLink]="['/stocks', ticker]" class="stock-card">
      <div class="stock-top">
        <div class="ticker">
          {{ ticker }}
          <span *ngIf="nameEn">{{ nameEn }}</span>
        </div>
        <div class="stock-top-side">
          <span class="change" *ngIf="changePct !== null && changePct !== undefined"
                [ngClass]="changePct >= 0 ? 'positive' : 'negative'">
            {{ changePct > 0 ? '+' : '' }}{{ changePct | number:'1.2-2' }}%
          </span>
          <app-favorite-toggle *ngIf="showFavorite" [symbol]="ticker"></app-favorite-toggle>
        </div>
      </div>

      <div class="stock-name">{{ nameAr || ticker }}</div>

      <div class="stock-price">
        <strong [appPriceFlash]="closingPrice">{{ closingPrice !== null && closingPrice !== undefined ? (closingPrice | number:'1.2-2') : '—' }}</strong>
        <span>{{ currencyLabel }}</span>
        <em *ngIf="weight !== null && weight !== undefined && weight > 0" class="neutral-pill" [class.capped-pill]="isCapped" [title]="isCapped ? 'تم سقف الوزن عند 35% (معامل السقف: ' + (cappingFactor | number:'1.4-4') + ')' : ''">
          الوزن {{ weight | number:'1.2-2' }}%
          <span *ngIf="isCapped" class="capped-badge" [title]="'معامل السقف: ' + (cappingFactor | number:'1.4-4')">(مسقوف)</span>
        </em>
      </div>

      <div class="stock-bottom">
        <div class="mini-ratio">
          <app-status-badge [status]="shariahStatus"></app-status-badge>
        </div>
        <app-comparison-badge [comparison]="priceComparison" [fairValueDiffPct]="fairValueDiffPct" [closingPrice]="closingPrice" [fairValue]="fairValue"></app-comparison-badge>
      </div>

      <div class="stock-meta" *ngIf="indexLabels && indexLabels.length">
        <span>{{ indexLabels.join(' · ') }}</span>
      </div>
    </a>
  `
})
export class StockCardComponent {
  @Input() ticker = '';
  @Input() nameAr?: string | null;
  @Input() nameEn?: string | null;
  @Input() closingPrice?: number | null;
  @Input() changePct?: number | null;
  @Input() fairValue?: number | null;
  @Input() priceComparison?: string | null;
  @Input() fairValueDiffPct?: number | null;
  @Input() shariahStatus?: string | null;
  @Input() indices: string[] = [];
  @Input() weight?: number | null;
  @Input() isCapped?: boolean | null;
  @Input() cappingFactor?: number | null;
  @Input() currency?: string | null;
  @Input() sectorNameAr?: string | null;
  /** Shows the favorite star toggle next to the change percentage. */
  @Input() showFavorite = false;

  readonly ShieldCheckIcon = ShieldCheck;

  get currencyLabel(): string {
    return this.currency && this.currency.includes('دولار') ? '$' : 'ج.م';
  }

  get indexLabels(): string[] {
    if (!this.indices || !this.indices.length) return [];
    return this.indices.map(code => {
      if (code === 'Sectoral-Indices') {
        return this.sectorNameAr || INDEX_ARABIC_NAMES['Sectoral-Indices'] || 'قطاعي';
      }
      return INDEX_ARABIC_NAMES[code] || code;
    });
  }
}
