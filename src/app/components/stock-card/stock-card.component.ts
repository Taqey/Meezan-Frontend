import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ShieldCheck } from 'lucide-angular';
import { ComparisonBadgeComponent } from '../comparison-badge/comparison-badge.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { FavoriteToggleComponent } from '../favorite-toggle/favorite-toggle.component';
import { PriceFlashDirective } from '../../directives/price-flash.directive';
import { INDEX_ARABIC_NAMES } from '../../models/api.models';
import {
  getNonComplianceReasons,
  normalizeStatusValue
} from '../../models/shariah-standards';

@Component({
  selector: 'app-stock-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ComparisonBadgeComponent, StatusBadgeComponent, FavoriteToggleComponent, PriceFlashDirective],
  template: `
    <a [routerLink]="['/stocks', ticker]" class="stock-card">
      <div class="stock-top">
        <div class="ticker">
          <span class="ticker-symbol">{{ ticker }}</span>
          <span class="ticker-en" [attr.title]="nameEn">{{ nameEn || '—' }}</span>
        </div>
        <div class="stock-top-side">
          <span class="change" [ngClass]="changePct !== null && changePct !== undefined ? (changePct >= 0 ? 'positive' : 'negative') : 'muted'">
            {{ changePct !== null && changePct !== undefined ? (changePct > 0 ? '+' : '') + (changePct | number:'1.2-2') + '%' : '—' }}
          </span>
          <app-favorite-toggle *ngIf="showFavorite" [symbol]="ticker"></app-favorite-toggle>
        </div>
      </div>

      <div class="stock-name" [attr.title]="nameAr || ticker">{{ nameAr || ticker }}</div>

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
          <app-status-badge [status]="effectiveShariahStatus"></app-status-badge>
        </div>
        <app-comparison-badge [comparison]="priceComparison" [fairValueDiffPct]="fairValueDiffPct" [closingPrice]="closingPrice" [fairValue]="fairValue"></app-comparison-badge>
      </div>

      <!-- Non-compliance reason slot: always rendered with reserved height or neutral line to prevent card jump -->
      <div class="noncompliance-reason"
           [class.empty]="!nonComplianceReasons.length"
           [attr.title]="nonComplianceReasons.join(' · ')">
        <span *ngIf="nonComplianceReasons.length > 0">
          <span *ngFor="let r of nonComplianceReasons; let last = last">{{ r }}<span *ngIf="!last"> · </span></span>
        </span>
        <span *ngIf="!nonComplianceReasons.length" class="empty-placeholder">&nbsp;</span>
      </div>

      <div class="stock-meta" [class.empty]="!indexLabels.length">
        <span *ngIf="indexLabels && indexLabels.length">{{ indexLabels.join(' · ') }}</span>
        <span *ngIf="!indexLabels || !indexLabels.length" class="empty-placeholder">&nbsp;</span>
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

  // Shariah metrics for non-compliance reason display
  @Input() coreActivityCompliant?: boolean | null;
  @Input() categoryAr?: string | null;
  @Input() spHaramEarningPercentage?: number | null;
  @Input() loansPercentage?: number | null;

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

  /**
   * Stored verdict only — no client-side recomputation or upgrade.
   * Scholars-only compliant stocks are normal green "متوافق" here (no amber,
   * no extra text); that note lives only on the detail page.
   * Doubtful/مشكوك never renders (mapped to insufficient upstream).
   */
  get effectiveShariahStatus(): string | null | undefined {
    return this.shariahStatus;
  }

  /** Non-compliance reasons to show below the badge — empty unless effective status is NonCompliant. */
  get nonComplianceReasons(): string[] {
    if (normalizeStatusValue(this.effectiveShariahStatus) !== 'noncompliant') return [];
    return getNonComplianceReasons({
      coreActivityCompliant: this.coreActivityCompliant,
      categoryAr: this.categoryAr,
      spHaramEarningPercentage: this.spHaramEarningPercentage,
      loansPercentage: this.loansPercentage
    });
  }
}