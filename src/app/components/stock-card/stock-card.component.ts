import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ShieldCheck } from 'lucide-angular';
import { ComparisonBadgeComponent } from '../comparison-badge/comparison-badge.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { INDEX_ARABIC_NAMES } from '../../models/api.models';

@Component({
  selector: 'app-stock-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ComparisonBadgeComponent, StatusBadgeComponent],
  template: `
    <a [routerLink]="['/stocks', ticker]" class="stock-card">
      <div class="stock-top">
        <div class="ticker">
          {{ ticker }}
          <span *ngIf="nameEn">{{ nameEn }}</span>
        </div>
        <span class="change" [ngClass]="(changePct || 0) >= 0 ? 'positive' : 'negative'">
          {{ (changePct || 0) > 0 ? '+' : '' }}{{ (changePct || 0) | number:'1.2-2' }}%
        </span>
      </div>

      <div class="stock-name">{{ nameAr || ticker }}</div>

      <div class="stock-price">
        <strong>{{ (closingPrice || 0) | number:'1.2-2' }}</strong>
        <span>{{ currencyLabel }}</span>
        <em *ngIf="weight && weight > 0">الوزن {{ weight | number:'1.2-2' }}%</em>
      </div>

      <div class="stock-bottom">
        <div class="mini-ratio">
          <app-status-badge [status]="shariahStatus"></app-status-badge>
        </div>
        <app-comparison-badge [comparison]="priceComparison"></app-comparison-badge>
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
  @Input() shariahStatus?: string | null;
  @Input() indices: string[] = [];
  @Input() weight?: number | null;
  @Input() currency?: string | null;
  @Input() sectorNameAr?: string | null;

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
