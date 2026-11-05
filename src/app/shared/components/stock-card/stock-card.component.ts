import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ShieldCheck } from 'lucide-angular';
import { ComparisonBadgeComponent } from '../comparison-badge/comparison-badge.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { FavoriteToggleComponent } from '../favorite-toggle/favorite-toggle.component';
import { PriceFlashDirective } from '../../directives/price-flash.directive';
import { indexShortNameFor } from '../../models/market-icons';
import {
  getNonComplianceReasons,
  normalizeStatusValue
} from '../../models/shariah-standards';

@Component({
  selector: 'app-stock-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ComparisonBadgeComponent, StatusBadgeComponent, FavoriteToggleComponent, PriceFlashDirective],
  templateUrl: './stock-card.component.html',
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
        return this.sectorNameAr || 'المؤشرات القطاعية';
      }
      return indexShortNameFor(code) || code;
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